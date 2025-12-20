"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Calculator } from "lucide-react"

interface AddStockDialogProps {
    trigger?: React.ReactNode;
}

export function AddStockDialog({ trigger }: AddStockDialogProps) {
    const [open, setOpen] = useState(false)

    // Basic Info
    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [category, setCategory] = useState("Umum")

    // Stock Logic
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState("pcs")
    const [minStock, setMinStock] = useState("5")

    // Pricing Logic
    const [displayPrice, setDisplayPrice] = useState("") // Selling Price (String)
    const [rawPrice, setRawPrice] = useState(0)          // Selling Price (Number)

    const [displayCostPrice, setDisplayCostPrice] = useState("") // HPP Unit (String)
    const [costPrice, setCostPrice] = useState(0)                // HPP Unit (Number)

    // "Kulakan" Logic (Total Capital)
    const [displayTotalModal, setDisplayTotalModal] = useState("")
    const [rawTotalModal, setRawTotalModal] = useState(0)

    // --- HANDLERS ---

    // 1. Handle Total Modal Change (Auto-calculate HPP)
    const handleTotalModalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "")
        if (!value) {
            setDisplayTotalModal("")
            setRawTotalModal(0)
            return
        }

        const total = parseInt(value, 10)
        setRawTotalModal(total)
        setDisplayTotalModal(total.toLocaleString("id-ID"))

        // Auto Calc HPP if Qty is present
        const qtyNum = parseInt(quantity)
        if (qtyNum > 0) {
            const hpp = Math.round(total / qtyNum)
            setCostPrice(hpp)
            setDisplayCostPrice(hpp.toLocaleString("id-ID"))
        }
    }

    // 2. Handle Quantity Change (Recalculate HPP if Modal exists)
    const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantity(e.target.value)
        const qtyNum = parseInt(e.target.value)

        if (rawTotalModal > 0 && qtyNum > 0) {
            const hpp = Math.round(rawTotalModal / qtyNum)
            setCostPrice(hpp)
            setDisplayCostPrice(hpp.toLocaleString("id-ID"))
        }
    }

    // 3. Handle Direct HPP Change (Optional manual override)
    const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "")
        if (!value) {
            setDisplayCostPrice("")
            setCostPrice(0)
            return
        }
        const hpp = parseInt(value, 10)
        setCostPrice(hpp)
        setDisplayCostPrice(hpp.toLocaleString("id-ID"))

        // Reverse Calc: If user types HPP manually, clear Total Modal to avoid confusion? 
        // Or update Total Modal? Let's update Total Modal for consistency.
        const qtyNum = parseInt(quantity)
        if (qtyNum > 0) {
            const total = hpp * qtyNum
            setRawTotalModal(total)
            setDisplayTotalModal(total.toLocaleString("id-ID"))
        }
    }

    // 4. Handle Selling Price
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "")
        if (!value) {
            setDisplayPrice("")
            setRawPrice(0)
            return
        }
        const price = parseInt(value, 10)
        setRawPrice(price)
        setDisplayPrice(price.toLocaleString("id-ID"))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await db.stocks.add({
                name,
                sku,
                category,
                unit,
                quantity: Number(quantity),
                price: rawPrice,
                costPrice: costPrice,
                minStock: Number(minStock),
                updatedAt: new Date()
            })

            // Reset States
            setDisplayPrice(""); setRawPrice(0);
            setDisplayCostPrice(""); setCostPrice(0);
            setDisplayTotalModal(""); setRawTotalModal(0);
            setName(""); setSku(""); setQuantity("");
            setOpen(false)

            alert("Barang berhasil ditambahkan!")
        } catch (error) {
            console.error("Failed to add stock:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button><Plus className="mr-2 h-4 w-4" /> Tambah Barang</Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tambah Barang Baru</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Name Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Barang</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Indomie Goreng" />
                    </div>

                    {/* SKU & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU / Kode</Label>
                            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toLocaleUpperCase())} required placeholder="A001" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="qty">Jumlah Stok</Label>
                            <Input id="qty" type="number" value={quantity} onChange={handleQtyChange} required placeholder="0" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Satuan</Label>
                            <Select onValueChange={setUnit} defaultValue={unit}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pcs">Pcs</SelectItem>
                                    <SelectItem value="kg">Kilogram</SelectItem>
                                    <SelectItem value="gr">Gram</SelectItem>
                                    <SelectItem value="box">Box</SelectItem>
                                    <SelectItem value="ltr">Liter</SelectItem>
                                    <SelectItem value="btl">Botol</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* --- KULAKAN CALCULATOR --- */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                        <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold">
                            <Calculator className="h-4 w-4" />
                            Hitung Modal Kulakan
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Total Modal (Input) */}
                            <div className="grid gap-2">
                                <Label className="text-xs text-blue-900">Total Modal (Semua Stok)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                    <Input
                                        type="text"
                                        placeholder="Contoh: 50.000"
                                        className="pl-9 border-blue-200 focus-visible:ring-blue-500"
                                        value={displayTotalModal}
                                        onChange={handleTotalModalChange}
                                    />
                                </div>
                            </div>

                            {/* HPP Per Unit (Auto-Calculated) */}
                            <div className="grid gap-2">
                                <Label className="text-xs text-blue-900">HPP Per Satuan (Auto)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                    <Input
                                        type="text"
                                        className="pl-9 font-semibold bg-white"
                                        value={displayCostPrice}
                                        onChange={handleCostPriceChange} // Can still edit manually
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selling Price & Alert */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Harga Jual (Per Satuan)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                <Input
                                    id="price"
                                    type="text"
                                    placeholder="0"
                                    className="pl-9 font-bold"
                                    value={displayPrice}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Min. Alert</Label>
                            <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
                        </div>
                    </div>

                    <Button type="submit" className="cursor-pointer w-full mt-2">Simpan Barang</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}