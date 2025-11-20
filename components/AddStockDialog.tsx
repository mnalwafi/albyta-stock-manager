"use client"

import { useState } from "react"
import { db } from "@/lib/db" // Import your Dexie DB
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
    trigger?: React.ReactNode; // Accept a custom button
}

export function AddStockDialog({ trigger }: AddStockDialogProps) {
    const [open, setOpen] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [quantity, setQuantity] = useState("")
    const [price, setPrice] = useState("")
    const [unit, setUnit] = useState("pcs") // Default unit
    const [category, setCategory] = useState("General")
    const [displayPrice, setDisplayPrice] = useState("")
    const [rawPrice, setRawPrice] = useState(0)
    const [costPrice, setCostPrice] = useState(0)
    const [minStock, setMinStock] = useState("5")

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Remove any non-digit characters (remove dots, Rp, letters)
        const numberString = value.replace(/[^0-9]/g, "");

        if (!numberString) {
            setDisplayPrice("");
            setRawPrice(0);
            return;
        }

        const number = parseInt(numberString, 10);

        // Set the raw number for the Database
        setRawPrice(number);

        // Set the formatted string for the User (e.g. "10.000")
        setDisplayPrice(number.toLocaleString("id-ID"));
    };

    // The Save Function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await db.stocks.add({
                name,
                sku,
                category,
                unit,
                quantity: Number(quantity), // Convert string to number
                price: rawPrice,
                costPrice: costPrice, // Save it!
                minStock: Number(minStock),
                updatedAt: new Date()
            })

            setDisplayPrice("");
            setRawPrice(0);
            // 2. Reset Form & Close Modal
            setName(""); setSku(""); setQuantity(""); setPrice("");
            setOpen(false)

            // Optional: Add a toast notification here later
            console.log("Stock added!")

        } catch (error) {
            console.error("Failed to add stock:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* 3. Conditional Rendering */}
                {trigger ? (
                    trigger
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Name Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    {/* SKU & Category Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toLocaleUpperCase())} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                    </div>

                    {/* Quantity & Unit Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="qty">Quantity</Label>
                            <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Min Stock Alert</Label>
                            <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Unit</Label>
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
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Capital Price (HPP)</Label> {/* New Field */}
                            <Input
                                type="number"
                                placeholder="Buy Price"
                                onChange={(e) => setCostPrice(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Selling Price</Label>
                            <Label htmlFor="price">Price (per unit)</Label>
                            <div className="relative">
                                {/* The Prefix */}
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                    Rp
                                </span>

                                {/* The Input */}
                                <Input
                                    id="price"
                                    type="text"
                                    placeholder="0"
                                    className="pl-9" /* Padding Left to make room for 'Rp' */
                                    value={displayPrice}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="cursor-pointer">Save Item</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}