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
import { ArrowLeft, Receipt, Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TransactionHistoryPage() {
    const router = useRouter()

    const transactions = useLiveQuery(() =>
        db.transactions.orderBy("id").reverse().toArray()
    )

    const formatMoney = (n: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

    // --- THE NEW DELETE LOGIC ---
    const handleVoidTransaction = async (txId: number) => {
        const confirmed = confirm(
            "⚠️ VOID TRANSACTION?\n\nThis will delete the record AND restore the items to your inventory.\n\nAre you sure?"
        )

        if (!confirmed) return

        try {
            await db.transaction('rw', db.stocks, db.transactions, async () => {
                // 1. Get the transaction details
                const tx = await db.transactions.get(txId)
                if (!tx) throw new Error("Transaction not found")

                // 2. Loop through items and RESTORE stock
                for (const item of tx.items) {
                    const stockItem = await db.stocks.get(item.stockId)
                    // Only restore if the item still exists in DB
                    if (stockItem) {
                        await db.stocks.update(item.stockId, {
                            quantity: stockItem.quantity + item.qty
                        })
                    }
                }

                // 3. Delete the log
                await db.transactions.delete(txId)
            })
            alert("Transaction voided and stock restored.")
        } catch (error) {
            console.error(error)
            alert("Failed to void transaction.")
        }
    }

    if (!transactions) return <div className="p-10">Loading history...</div>

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">

            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="h-6 w-6" /> Transaction History
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Log of all completed sales.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Date & Time</TableHead>
                            <TableHead>Items Sold</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Cash / Change</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    No transactions recorded yet.
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
                                        <div>Cash: {formatMoney(tx.payment)}</div>
                                        <div>Change: {formatMoney(tx.change)}</div>
                                    </TableCell>

                                    {/* DELETE BUTTON */}
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            title="Void Transaction (Restores Stock)"
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