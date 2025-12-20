"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Receipt, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TransactionHistoryPage() {
    const router = useRouter()

    const transactions = useLiveQuery(() =>
        db.transactions.orderBy("id").reverse().toArray()
    )

    const formatMoney = (n: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

    const handleVoidTransaction = async (txId: number) => {
        const confirmed = confirm(
            "⚠️ BATALKAN TRANSAKSI?\n\nIni akan menghapus catatan DAN mengembalikan stok ke inventaris.\n\nApakah Anda yakin?" // Translated
        )

        if (!confirmed) return

        try {
            await db.transaction('rw', db.stocks, db.transactions, async () => {
                const tx = await db.transactions.get(txId)
                if (!tx) throw new Error("Transaction not found")

                for (const item of tx.items) {
                    const stockItem = await db.stocks.get(item.stockId)
                    if (stockItem) {
                        await db.stocks.update(item.stockId, {
                            quantity: stockItem.quantity + item.qty
                        })
                    }
                }

                await db.transactions.delete(txId)
            })
            alert("Transaksi dibatalkan dan stok dikembalikan.") // Translated
        } catch (error) {
            console.error(error)
            alert("Gagal membatalkan transaksi.") // Translated
        }
    }

    if (!transactions) return <div className="p-10">Memuat riwayat...</div> // Translated

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">

            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="h-6 w-6" /> Riwayat Transaksi {/* Translated */}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Catatan semua penjualan yang selesai. {/* Translated */}
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Waktu</TableHead> {/* Translated */}
                            <TableHead>Barang Terjual</TableHead> {/* Translated */}
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Tunai / Kembalian</TableHead> {/* Translated */}
                            <TableHead className="text-center">Aksi</TableHead> {/* Translated */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    Belum ada transaksi tercatat. {/* Translated */}
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">
                                        {format(tx.date, "dd MMM yyyy")}
                                        <div className="text-xs text-muted-foreground">
                                            {format(tx.date, "HH:mm")}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {tx.items.map((item, idx) => (
                                                <span key={idx} className="text-sm">
                                                    {item.qty}x {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right font-bold text-slate-700">
                                        {formatMoney(tx.total)}
                                    </TableCell>

                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        <div>Tunai: {formatMoney(tx.payment)}</div> {/* Translated */}
                                        <div>Kembali: {formatMoney(tx.change)}</div> {/* Translated */}
                                    </TableCell>

                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            title="Batalkan Transaksi (Kembalikan Stok)" // Translated
                                            onClick={() => handleVoidTransaction(tx.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}