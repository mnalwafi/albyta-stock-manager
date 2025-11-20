"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ShoppingBag, Copy, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RestockPage() {
    const router = useRouter()
    const stocks = useLiveQuery(() => db.stocks.toArray())

    if (!stocks) return <div className="p-10">Analyzing inventory...</div>

    // 1. Filter Low Stock Items
    const lowStockItems = stocks.filter(item => item.quantity <= item.minStock)

    // 2. Calculate Advice
    // Strategy: We suggest buying enough to reach 3x the minimum stock (Safety Stock)
    const adviceList = lowStockItems.map(item => {
        const targetLevel = item.minStock * 3
        const toBuy = targetLevel - item.quantity
        const estimatedCost = toBuy * (item.costPrice || 0)
        return { ...item, toBuy, estimatedCost }
    })

    const totalBudgetNeeded = adviceList.reduce((acc, item) => acc + item.estimatedCost, 0)

    // 3. WhatsApp / Clipboard Export
    const handleCopyList = () => {
        const date = new Date().toLocaleDateString("id-ID")
        let text = `📋 *Restock List - ${date}*\n\n`

        adviceList.forEach(item => {
            text += `- ${item.name}: ${item.toBuy} ${item.unit} (Stok Sisa: ${item.quantity})\n`
        })

        text += `\n💰 Est. Budget: Rp ${totalBudgetNeeded.toLocaleString("id-ID")}`

        navigator.clipboard.writeText(text)
        alert("Shopping list copied to clipboard! You can paste it in WhatsApp.")
    }

    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6" /> Restock Advice
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Items below alert threshold ({lowStockItems.length})
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* LEFT: SUMMARY CARD */}
                <Card className="md:col-span-1 h-fit bg-orange-50 border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-800">Estimated Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-700">
                            Rp {formatMoney(totalBudgetNeeded)}
                        </div>
                        <p className="text-sm text-orange-600 mt-2">
                            To restore items to safe levels (3x Min Stock).
                        </p>

                        <Button className="w-full mt-6 gap-2 bg-orange-600 hover:bg-orange-700" onClick={handleCopyList}>
                            <Copy className="h-4 w-4" /> Copy Shopping List
                        </Button>
                    </CardContent>
                </Card>

                {/* RIGHT: ITEMS TABLE */}
                <div className="md:col-span-2 rounded-md border bg-white min-w-0 shadow-sm flex flex-col">
                    <div className="overflow-x-auto w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Advice (To Buy)</TableHead>
                                    <TableHead className="text-right">Est. Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adviceList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <div className="flex flex-col items-center text-green-600 gap-2">
                                                <CheckCircle2 className="h-10 w-10" />
                                                <span className="font-medium">Inventory Healthy!</span>
                                                <span className="text-xs text-muted-foreground">No items are below minimum stock.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    adviceList.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">HPP: {formatMoney(item.costPrice)}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {item.quantity} / {item.minStock}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                +{item.toBuy} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600">
                                                Rp {formatMoney(item.estimatedCost)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>
        </div>
    )
}