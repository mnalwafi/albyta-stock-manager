"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type Consignment } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PackageOpen, CheckCircle2, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function ConsignmentPage() {
    const router = useRouter()
    const customers = useLiveQuery(() => db.customers.toArray())
    const stocks = useLiveQuery(() => db.stocks.toArray())
    const activeConsignments = useLiveQuery(() =>
        db.consignments.where("status").equals("OPEN").reverse().toArray()
    )

    // --- STATE FOR NEW CONSIGNMENT ---
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState("")
    const [selectedStock, setSelectedStock] = useState("")
    const [qty, setQty] = useState("")

    // --- STATE FOR SETTLEMENT (Setor) ---
    const [settleOpen, setSettleOpen] = useState(false)
    const [activeConsignment, setActiveConsignment] = useState<Consignment | null>(null)
    const [soldQtys, setSoldQtys] = useState<Record<number, number>>({})

    // 1. CREATE NEW CONSIGNMENT (Outbound)
    const handleCreate = async () => {
        if (!selectedCustomer || !selectedStock || !qty) return

        const stockItem = stocks?.find(s => s.id === Number(selectedStock))
        if (!stockItem) return

        const quantity = Number(qty)
        if (quantity > stockItem.quantity) {
            alert("Stok di gudang tidak cukup!") // Translated
            return
        }

        await db.transaction('rw', db.stocks, db.consignments, async () => {
            await db.stocks.update(stockItem.id, { quantity: stockItem.quantity - quantity })

            await db.consignments.add({
                date: new Date(),
                customerId: Number(selectedCustomer),
                status: 'OPEN',
                items: [{
                    stockId: stockItem.id,
                    name: stockItem.name,
                    initialQty: quantity,
                    costPrice: stockItem.costPrice || 0,
                    price: stockItem.price
                }]
            })
        })

        setIsNewOpen(false); setQty(""); setSelectedStock("");
        alert("Barang berhasil dipindahkan ke Reseller!") // Translated
    }

    // 2. SETTLE CONSIGNMENT (Inbound/Money)
    const handleSettle = async () => {
        if (!activeConsignment) return

        try {
            await db.transaction('rw', db.stocks, db.transactions, db.consignments, async () => {
                let totalRevenue = 0
                const txItems = []

                for (const item of activeConsignment.items) {
                    const sold = soldQtys[item.stockId] || 0
                    const returned = item.initialQty - sold

                    if (sold > item.initialQty) throw new Error("Jumlah terjual tidak boleh melebihi stok awal") // Translated

                    // Return unsold items to Warehouse
                    if (returned > 0) {
                        const currentStock = await db.stocks.get(item.stockId)
                        if (currentStock) {
                            await db.stocks.update(item.stockId, { quantity: currentStock.quantity + returned })
                        }
                    }

                    // Prepare Sales Record
                    if (sold > 0) {
                        totalRevenue += sold * item.price
                        txItems.push({
                            stockId: item.stockId, name: item.name, qty: sold, price: item.price, costPrice: item.costPrice
                        })
                    }
                }

                // Create Transaction
                if (txItems.length > 0) {
                    await db.transactions.add({
                        date: new Date(),
                        total: totalRevenue,
                        payment: totalRevenue,
                        change: 0,
                        customerId: activeConsignment.customerId,
                        isDebt: false,
                        items: txItems
                    })
                }

                // Close Consignment
                await db.consignments.update(activeConsignment.id, {
                    status: 'SETTLED',
                    settledAt: new Date()
                })
            })

            setSettleOpen(false)
            alert("Setoran berhasil! Pendapatan dicatat dan sisa barang dikembalikan.") // Translated
        } catch (e) {
            alert("Gagal memproses setoran. Cek input anda.") // Translated
        }
    }

    const getCustomerName = (id: number) => customers?.find(c => c.id === id)?.name || "Unknown"

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Truck className="h-6 w-6" /> Titip Jual (Konsinyasi) {/* Translated */}
                        </h1>
                        <p className="text-muted-foreground text-sm">Pantau barang yang dibawa reseller.</p> {/* Translated */}
                    </div>
                </div>

                {/* NEW CONSIGNMENT MODAL */}
                <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                    <DialogTrigger asChild><Button>+ Kirim Barang</Button></DialogTrigger> {/* Translated */}
                    <DialogContent>
                        <DialogHeader><DialogTitle>Kirim ke Reseller/Warung</DialogTitle></DialogHeader> {/* Translated */}
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pilih Reseller</label> {/* Translated */}
                                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                                    <SelectContent>
                                        {customers?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Barang</label> {/* Translated */}
                                <Select value={selectedStock} onValueChange={setSelectedStock}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Barang" /></SelectTrigger>
                                    <SelectContent>
                                        {stocks?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} (Sisa: {s.quantity})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jumlah Kirim</label> {/* Translated */}
                                <Input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
                            </div>
                            <Button onClick={handleCreate} className="w-full">Konfirmasi Kirim</Button> {/* Translated */}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ACTIVE LIST */}
            <div className="grid gap-4">
                {activeConsignments?.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border rounded-md bg-slate-50">
                        Tidak ada titipan aktif. Semua sudah setor! {/* Translated */}
                    </div>
                ) : (
                    activeConsignments?.map(con => (
                        <Card key={con.id}>
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg">{getCustomerName(con.customerId)}</h3>
                                    <p className="text-sm text-muted-foreground">Dikirim: {con.date.toLocaleDateString()}</p> {/* Translated */}
                                    <div className="mt-2 space-y-1">
                                        {con.items.map((item, idx) => (
                                            <div key={idx} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block mr-2">
                                                {item.name}: <strong>{item.initialQty} pcs</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SETTLE BUTTON */}
                                <Dialog open={settleOpen && activeConsignment?.id === con.id} onOpenChange={(o) => {
                                    setSettleOpen(o);
                                    if (o) {
                                        setActiveConsignment(con);
                                        setSoldQtys({});
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                                            <PackageOpen className="mr-2 h-4 w-4" /> Setor / Lapor {/* Translated */}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Proses Setoran</DialogTitle></DialogHeader> {/* Translated */}
                                        <div className="py-4 space-y-6">
                                            <p className="text-sm text-muted-foreground">
                                                Masukkan jumlah yang <strong>TERJUAL</strong>. Sisanya akan otomatis dikembalikan ke gudang. {/* Translated */}
                                            </p>

                                            {con.items.map((item) => (
                                                <div key={item.stockId} className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground">Awal: {item.initialQty}</div> {/* Translated */}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-bold">LAKU:</label> {/* Translated */}
                                                        <Input
                                                            type="number"
                                                            className="w-20"
                                                            min={0}
                                                            max={item.initialQty}
                                                            placeholder="0"
                                                            onChange={(e) => setSoldQtys(prev => ({
                                                                ...prev,
                                                                [item.stockId]: Number(e.target.value)
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            <Button onClick={handleSettle} className="w-full bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Selesaikan Setoran {/* Translated */}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}