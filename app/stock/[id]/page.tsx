"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Save, Trash2, Minus, Plus, TrendingUp } from "lucide-react"

export default function StockDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = parseInt(params.id as string)

    const stock = useLiveQuery(() => db.stocks.get(id))

    // Form State
    const [name, setName] = useState("")
    const [sku, setSku] = useState("")
    const [quantity, setQuantity] = useState(0)
    const [category, setCategory] = useState("")
    const [unit, setUnit] = useState("")

    // --- PRICING STATE ---
    const [price, setPrice] = useState(0) // Selling Price
    const [displayPrice, setDisplayPrice] = useState("")

    const [costPrice, setCostPrice] = useState(0) // Capital Price (HPP)
    const [displayCostPrice, setDisplayCostPrice] = useState("")
    const [minStock, setMinStock] = useState(0)

    // Populate Form
    useEffect(() => {
        if (stock) {
            setName(stock.name)
            setSku(stock.sku)
            setQuantity(stock.quantity)
            setCategory(stock.category)
            setUnit(stock.unit)

            // Load Prices
            setPrice(stock.price)
            setDisplayPrice(stock.price.toLocaleString("id-ID"))

            // Load Cost (Default to 0 if new)
            const cost = stock.costPrice || 0
            setCostPrice(cost)
            setDisplayCostPrice(cost.toLocaleString("id-ID"))
            setMinStock(stock.minStock || 5)
        }
    }, [stock])

    // Format Helpers
    const handleMoneyInput = (val: string, setRaw: any, setDisplay: any) => {
        const clean = val.replace(/[^0-9]/g, "")
        if (!clean) { setRaw(0); setDisplay(""); return }
        const num = parseInt(clean)
        setRaw(num)
        setDisplay(num.toLocaleString("id-ID"))
    }

    // Save Changes
    const handleSave = async () => {
        await db.stocks.update(id, {
            name, sku, category, unit, quantity,
            price,
            costPrice, // We save the HPP now!
            minStock,
            updatedAt: new Date()
        })
        router.back()
    }

    const adjustStock = async (amount: number) => {
        const newQty = quantity + amount
        if (newQty < 0) return
        setQuantity(newQty)
        await db.stocks.update(id, { quantity: newQty })
    }

    // --- CALCULATE PROFIT PREVIEW ---
    const profitPerUnit = price - costPrice
    const margin = price > 0 ? (profitPerUnit / price) * 100 : 0

    if (!stock) return <div className="p-10">Loading item...</div>

    return (
        <div className="flex flex-1 flex-col gap-4 w-full mt-4">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">{stock.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>SKU: {stock.sku}</span>
                        <span>•</span>
                        <span>{stock.category}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* --- LEFT: PRODUCT DETAILS FORM --- */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Edit Product</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid gap-2">
                            <Label>Product Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>SKU</Label>
                                <Input value={sku} onChange={e => setSku(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Input value={category} onChange={e => setCategory(e.target.value)} />
                            </div>
                        </div>

                        <div className="border-t my-4"></div>

                        {/* --- PRICING SECTION (UPDATED) --- */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Pricing & Profit
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Capital Price (HPP) */}
                                <div className="grid gap-2">
                                    <Label className="text-muted-foreground">Capital Price (HPP)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                        <Input
                                            className="pl-9 bg-slate-50"
                                            value={displayCostPrice}
                                            onChange={e => handleMoneyInput(e.target.value, setCostPrice, setDisplayCostPrice)}
                                        />
                                    </div>
                                </div>

                                {/* Selling Price */}
                                <div className="grid gap-2">
                                    <Label>Selling Price</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                                        <Input
                                            className="pl-9 font-bold"
                                            value={displayPrice}
                                            onChange={e => handleMoneyInput(e.target.value, setPrice, setDisplayPrice)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* LIVE PROFIT PREVIEW */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Profit per unit:</span>
                                    <div className="font-bold text-green-600">
                                        Rp {(profitPerUnit).toLocaleString("id-ID")}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground text-sm">Margin</span>
                                    <div className={`font-bold ${margin < 20 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6 pt-4 border-t">
                            <Button onClick={handleSave} className="w-full">
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* --- RIGHT: STOCK CONTROL --- */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Inventory Level</CardTitle>
                        <CardDescription>Quick adjust stock count</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <div className="py-4">
                            <div className="text-6xl font-bold text-slate-800 tracking-tighter">
                                {quantity}
                            </div>
                            <div className="text-sm font-medium text-slate-500 uppercase mt-1">{unit || "Units"}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-12" onClick={() => adjustStock(-1)}>
                                <Minus className="mr-2 h-4 w-4" /> Remove
                            </Button>
                            <Button variant="outline" className="h-12" onClick={() => adjustStock(1)}>
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>

                        <div className="pt-4 border-t mt-4">
                            <Label className="text-xs text-muted-foreground mb-2 block">Alert Threshold (Min Stock)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Alert when below:</span>
                                <Input
                                    type="number"
                                    className="w-20 text-center"
                                    value={minStock}
                                    onChange={(e) => setMinStock(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Label className="text-xs text-muted-foreground mb-2 block">Manual Override</Label>
                            <Input
                                type="number"
                                className="text-center"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}