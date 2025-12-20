"use client"

import { useState, useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, BarChart3, DollarSign, PieChart, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns"
import * as XLSX from "xlsx"

export default function ReportsPage() {
    const router = useRouter()

    const transactions = useLiveQuery(() => db.transactions.toArray())
    const stocks = useLiveQuery(() => db.stocks.toArray())

    const [timeRange, setTimeRange] = useState("this-month")

    // --- DATA ENGINE (Calculations) ---
    const reportData = useMemo(() => {
        if (!transactions || !stocks) return null

        const now = new Date()
        const start = startOfMonth(now)
        const end = endOfMonth(now)

        // 1. Filter Transactions
        const filteredTx = transactions.filter(tx => {
            if (timeRange === 'all-time') return true
            return isWithinInterval(tx.date, { start, end })
        })

        // 2. Aggregate Data
        let revenue = 0
        let cogs = 0
        let itemsSold = 0
        const categorySales: Record<string, number> = {}
        const productSales: Record<string, { qty: number, revenue: number }> = {}

        const getCategory = (id: number) => stocks.find(s => s.id === id)?.category || "Uncategorized"

        const detailedTxRows = filteredTx.map(tx => {
            let txCost = 0
            const itemNames = tx.items.map(i => {
                txCost += (i.costPrice || 0) * i.qty
                return `${i.name} (${i.qty})`
            }).join(", ")

            revenue += tx.total
            cogs += txCost

            tx.items.forEach(item => {
                itemsSold += item.qty
                if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 }
                productSales[item.name].qty += item.qty
                productSales[item.name].revenue += (item.price * item.qty)
                
                const cat = getCategory(item.stockId)
                categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.qty)
            })

            return {
                Date: format(tx.date, "yyyy-MM-dd HH:mm"),
                Items: itemNames,
                Total_Revenue: tx.total,
                Total_Cost: txCost,
                Gross_Profit: tx.total - txCost,
                Payment_Method: tx.isDebt ? "Debt (Kasbon)" : "Cash"
            }
        })

        const grossProfit = revenue - cogs
        const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

        const topProducts = Object.entries(productSales)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)

        const topCategories = Object.entries(categorySales)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)

        return {
            revenue, cogs, grossProfit, margin, itemsSold, count: filteredTx.length,
            topProducts, topCategories, detailedTxRows
        }
    }, [transactions, stocks, timeRange])


    // --- EXCEL EXPORT FUNCTION ---
    const handleDownloadExcel = () => {
        if (!reportData || !stocks) return

        const summaryData = [
            { Metric: "Report Period", Value: timeRange === 'this-month' ? "This Month" : "All Time" },
            { Metric: "Generated At", Value: format(new Date(), "yyyy-MM-dd HH:mm") },
            {}, 
            { Metric: "Total Revenue", Value: reportData.revenue },
            { Metric: "Cost of Goods Sold (HPP)", Value: reportData.cogs },
            { Metric: "Gross Profit", Value: reportData.grossProfit },
            { Metric: "Net Margin (%)", Value: `${reportData.margin.toFixed(2)}%` },
            { Metric: "Transactions Count", Value: reportData.count },
            { Metric: "Items Sold", Value: reportData.itemsSold },
        ]
        const sheetSummary = XLSX.utils.json_to_sheet(summaryData)

        const sheetSales = XLSX.utils.json_to_sheet(reportData.detailedTxRows)

        const inventoryRows = stocks.map(s => ({
            ID: s.id,
            Name: s.name,
            Category: s.category,
            Stock_Qty: s.quantity,
            Unit: s.unit,
            Cost_Price: s.costPrice || 0,
            Selling_Price: s.price,
            Total_Asset_Value: (s.costPrice || 0) * s.quantity
        }))
        const sheetInventory = XLSX.utils.json_to_sheet(inventoryRows)

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, sheetSummary, "Ringkasan")
        XLSX.utils.book_append_sheet(workbook, sheetSales, "Log Penjualan")
        XLSX.utils.book_append_sheet(workbook, sheetInventory, "Status Stok")

        XLSX.writeFile(workbook, `Laporan_Keuangan_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }


    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)

    if (!reportData) return <div className="p-10">Menyiapkan Laporan...</div> // Translated

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-6 w-6" /> Laporan Keuangan {/* Translated */}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Analisa keuntungan dan performa toko. {/* Translated */}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 border rounded-md">
                    <Calendar className="h-4 w-4 text-slate-500 ml-2" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="border-0 focus:ring-0 w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this-month">Bulan Ini</SelectItem> {/* Translated */}
                            <SelectItem value="all-time">Semua Waktu</SelectItem> {/* Translated */}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* P&L Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="bg-slate-900 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Total Pendapatan</CardTitle></CardHeader> {/* Translated */}
                    <CardContent><div className="text-2xl font-bold">Rp {formatMoney(reportData.revenue)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Modal (HPP)</CardTitle></CardHeader> {/* Translated */}
                    <CardContent><div className="text-2xl font-bold text-slate-700">Rp {formatMoney(reportData.cogs)}</div></CardContent>
                </Card>
                <Card className={reportData.grossProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-800">Laba Kotor</CardTitle></CardHeader> {/* Translated */}
                    <CardContent><div className={`text-2xl font-bold ${reportData.grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>Rp {formatMoney(reportData.grossProfit)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Margin Bersih</CardTitle></CardHeader> {/* Translated */}
                    <CardContent><div className="text-2xl font-bold text-blue-600">{reportData.margin.toFixed(1)}%</div></CardContent>
                </Card>
            </div>

            {/* Tables */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" /> Produk Terlaris</CardTitle></CardHeader> {/* Translated */}
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Nama Barang</TableHead><TableHead className="text-right">Pendapatan</TableHead></TableRow></TableHeader> {/* Translated */}
                            <TableBody>
                                {reportData.topProducts.map((p, i) => (
                                    <TableRow key={i}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right">Rp {formatMoney(p.revenue)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PieChart className="h-4 w-4" /> Penjualan per Kategori</CardTitle></CardHeader> {/* Translated */}
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader> {/* Translated */}
                            <TableBody>
                                {reportData.topCategories.map((c, i) => (
                                    <TableRow key={i}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-right">{reportData.revenue > 0 ? ((c.total / reportData.revenue) * 100).toFixed(0) : 0}%</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* --- EXCEL BUTTON --- */}
            <div className="mt-8 text-center">
                <Button
                    onClick={handleDownloadExcel}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Download className="h-4 w-4" />
                    Unduh Laporan Excel (.xlsx) {/* Translated */}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    Termasuk: Ringkasan, Log Transaksi, dan Status Stok Gudang. {/* Translated */}
                </p>
            </div>
        </div>
    )
}