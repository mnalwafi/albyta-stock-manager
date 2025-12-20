"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"

interface AddStockDialogProps {
    trigger?: React.ReactNode; 
}

export function AddStockDialog({ trigger }: AddStockDialogProps) {
    const [open, setOpen] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [quantity, setQuantity] = useState("")
    const [price, setPrice] = useState("")
    const [unit, setUnit] = useState("pcs") 
    const [category, setCategory] = useState("Umum") // Translated Default
    const [displayPrice, setDisplayPrice] = useState("")
    const [rawPrice, setRawPrice] = useState(0)
    const [costPrice, setCostPrice] = useState(0)
    const [minStock, setMinStock] = useState("5")

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numberString = value.replace(/[^0-9]/g, "");

        if (!numberString) {
            setDisplayPrice("");
            setRawPrice(0);
            return;
        }

        const number = parseInt(numberString, 10);
        setRawPrice(number);
        setDisplayPrice(number.toLocaleString("id-ID"));
    };

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

            setDisplayPrice("");
            setRawPrice(0);
            // Reset Form & Close Modal
            setName(""); setSku(""); setQuantity(""); setPrice("");
            setOpen(false)

            alert("Barang berhasil ditambahkan!") // Translated

        } catch (error) {
            console.error("Failed to add stock:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Barang {/* Translated */}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tambah Barang Baru</DialogTitle> {/* Translated */}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Name Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Barang</Label> {/* Translated */}
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Indomie Goreng" />
                    </div>

                    {/* SKU & Category Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU / Kode</Label> {/* Translated */}
                            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toLocaleUpperCase())} required placeholder="A001" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Kategori</Label> {/* Translated */}
                            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                    </div>

                    {/* Quantity & Unit Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="qty">Jumlah Stok</Label> {/* Translated */}
                            <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Min. Alert</Label> {/* Translated */}
                            <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Satuan</Label> {/* Translated */}
                            <Select onValueChange={setUnit} defaultValue={unit}>
                                <SelectTrigger className="cursor-pointer">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="cursor-pointer" value="pcs">Pcs</SelectItem>
                                    <SelectItem className="cursor-pointer" value="kg">Kilogram</SelectItem>
                                    <SelectItem className="cursor-pointer" value="gr">Gram</SelectItem>
                                    <SelectItem className="cursor-pointer" value="box">Box</SelectItem>
                                    <SelectItem className="cursor-pointer" value="ltr">Liter</SelectItem>
                                    <SelectItem className="cursor-pointer" value="btl">Botol</SelectItem> {/* Added common unit */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Harga Modal (HPP)</Label> {/* Translated */}
                            <Input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setCostPrice(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Harga Jual</Label> {/* Translated */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                    Rp
                                </span>
                                <Input
                                    id="price"
                                    type="text"
                                    placeholder="0"
                                    className="pl-9"
                                    value={displayPrice}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="cursor-pointer w-full mt-2">Simpan Barang</Button> {/* Translated */}
                </form>
            </DialogContent>
        </Dialog>
    )
}