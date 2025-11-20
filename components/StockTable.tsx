"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Trash2, Search, Filter, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount)
}

export function StockTable() {
    const router = useRouter()
    const stocks = useLiveQuery(() => db.stocks.toArray())

    // Local State for Filtering
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("All")

    if (!stocks) return <div className="text-center py-10">Loading data...</div>

    const uniqueCategories = ["All", ...Array.from(new Set(stocks.map(item => item.category))).filter(Boolean)]

    const filteredStocks = stocks.filter((stock) => {
        const matchesSearch =
            stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === "All" || stock.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-4">
            {/* --- TOOLBAR --- */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Filter Category" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat === "All" ? "All Categories" : cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Cost (HPP)</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStocks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStocks.map((stock) => (
                                <TableRow key={stock.id}>
                                    <TableCell>
                                        <div className="font-medium">{stock.name}</div>
                                        <div className="text-xs text-muted-foreground">{stock.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                                            {stock.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {stock.quantity} <span className="text-xs text-muted-foreground">{stock.unit}</span>
                                    </TableCell>

                                    {/* NEW COST DATA */}
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {stock.costPrice ? formatCurrency(stock.costPrice) : "-"}
                                    </TableCell>

                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(stock.price)}
                                    </TableCell>

                                    <TableCell className="text-right font-bold text-slate-600">
                                        {formatCurrency(stock.price * stock.quantity)}
                                    </TableCell>

                                    <TableCell className="text-center whitespace-nowrap">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="mr-2 hover:bg-slate-100"
                                            onClick={() => router.push(`/stock/${stock.id}`)}
                                        >
                                            <Pencil className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm('Delete this item?')) {
                                                    db.stocks.delete(stock.id)
                                                }
                                            }}
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

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStocks.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border rounded-md bg-slate-50">
                        No items found.
                    </div>
                ) : (
                    filteredStocks.map(stock => (
                        <div key={stock.id} className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold">{stock.name}</h3>
                                    <p className="text-xs text-muted-foreground">{stock.sku}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full">
                                    {stock.category}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <div className="text-muted-foreground">Stock:</div>
                                <div className={stock.quantity <= stock.minStock ? "text-red-600 font-bold" : "font-medium"}>
                                    {stock.quantity} {stock.unit}
                                </div>
                            </div>

                            <div className="flex justify-between text-sm">
                                <div className="text-muted-foreground">Price:</div>
                                <div className="font-bold">{formatCurrency(stock.price)}</div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="pt-3 border-t flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/stock/${stock.id}`)}>
                                    <Pencil className="mr-2 h-3 w-3" /> Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => { /* delete logic */ }}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-xs text-muted-foreground">
                Showing {filteredStocks.length} items
            </div>
        </div>
    )
}