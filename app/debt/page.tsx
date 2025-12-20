"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Book, HandCoins } from "lucide-react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"

export default function DebtBookPage() {
    const router = useRouter()
    // Only fetch customers who have debt > 0
    const customersWithDebt = useLiveQuery(() =>
        db.customers.where('totalDebt').above(0).toArray()
    )

    const [repayAmount, setRepayAmount] = useState(0)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [isPayOpen, setIsPayOpen] = useState(false)

    const handleRepay = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) return

        const newDebt = selectedCustomer.totalDebt - repayAmount

        await db.transaction('rw', db.customers, db.debt_payments, async () => {
            // 1. Update Balance
            await db.customers.update(selectedCustomer.id, {
                totalDebt: newDebt < 0 ? 0 : newDebt
            })
            // 2. Log Payment
            await db.debt_payments.add({
                customerId: selectedCustomer.id,
                amount: repayAmount,
                date: new Date()
            })
        })

        setIsPayOpen(false)
        setRepayAmount(0)
    }

    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)
    const totalOutstanding = customersWithDebt?.reduce((acc, c) => acc + c.totalDebt, 0) || 0

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Book className="h-6 w-6" /> Buku Kasbon (Hutang) {/* Translated */}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Kelola data hutang pelanggan. {/* Translated */}
                    </p>
                </div>
            </div>

            {/* Summary Card */}
            <Card className="mb-8 bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-red-800 text-sm font-medium">Total Hutang Belum Lunas</CardTitle> {/* Translated */}
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-700">Rp {formatMoney(totalOutstanding)}</div>
                    <p className="text-sm text-red-600 mt-1">
                        Dari {customersWithDebt?.length || 0} pelanggan {/* Translated */}
                    </p>
                </CardContent>
            </Card>

            {/* Debt Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Pelanggan</TableHead> {/* Translated */}
                            <TableHead>Telepon</TableHead> {/* Translated */}
                            <TableHead className="text-right">Jumlah Hutang</TableHead> {/* Translated */}
                            <TableHead className="text-right">Aksi</TableHead> {/* Translated */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customersWithDebt?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">Tidak ada hutang aktif.</TableCell></TableRow> // Translated
                        ) : (
                            customersWithDebt?.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell>{c.phone || "-"}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        Rp {formatMoney(c.totalDebt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog open={isPayOpen && selectedCustomer?.id === c.id} onOpenChange={(open) => {
                                            setIsPayOpen(open);
                                            if (open) setSelectedCustomer(c);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                                                    <HandCoins className="mr-2 h-4 w-4" /> Bayar {/* Translated */}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Pembayaran: {c.name}</DialogTitle></DialogHeader> {/* Translated */}
                                                <div className="py-4 text-center">
                                                    <div className="text-sm text-muted-foreground">Total Hutang</div> {/* Translated */}
                                                    <div className="text-3xl font-bold text-red-600 mb-4">Rp {formatMoney(c.totalDebt)}</div>

                                                    <form onSubmit={handleRepay} className="space-y-4 text-left">
                                                        <Label>Jumlah Bayar</Label> {/* Translated */}
                                                        <Input
                                                            type="number"
                                                            placeholder="Masukkan jumlah..."
                                                            value={repayAmount || ""}
                                                            onChange={e => setRepayAmount(Number(e.target.value))}
                                                            max={c.totalDebt}
                                                            required
                                                        />
                                                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                                            Konfirmasi Pembayaran {/* Translated */}
                                                        </Button>
                                                    </form>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
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