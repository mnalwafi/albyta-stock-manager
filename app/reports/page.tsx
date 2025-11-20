"use client"

import { useState, useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, BarChart3, DollarSign, PieChart, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns"
import * as XLSX from "xlsx" // IMPORT THE LIBRARY

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

        // Enhanced Transaction List for Excel
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
                // Product breakdown
                if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 }
                productSales[item.name].qty += item.qty
                productSales[item.name].revenue += (item.price * item.qty)
                // Category breakdown
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

        // Sort for UI
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

        // Sheet 1: Summary
        const summaryData = [
            { Metric: "Report Period", Value: timeRange === 'this-month' ? "This Month" : "All Time" },
            { Metric: "Generated At", Value: format(new Date(), "yyyy-MM-dd HH:mm") },
            {}, // Empty row
            { Metric: "Total Revenue", Value: reportData.revenue },
            { Metric: "Cost of Goods Sold", Value: reportData.cogs },
            { Metric: "Gross Profit", Value: reportData.grossProfit },
            { Metric: "Net Margin (%)", Value: `${reportData.margin.toFixed(2)}%` },
            { Metric: "Transactions Count", Value: reportData.count },
            { Metric: "Items Sold", Value: reportData.itemsSold },
        ]
        const sheetSummary = XLSX.utils.json_to_sheet(summaryData)

        // Sheet 2: Transactions (Detailed)
        const sheetSales = XLSX.utils.json_to_sheet(reportData.detailedTxRows)

        // Sheet 3: Current Inventory Snapshot
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

        // Create Workbook
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, sheetSummary, "Summary")
        XLSX.utils.book_append_sheet(workbook, sheetSales, "Sales Log")
        XLSX.utils.book_append_sheet(workbook, sheetInventory, "Inventory Status")

        // Download
        XLSX.writeFile(workbook, `Business_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }


    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)

    if (!reportData) return <div className="p-10">Generating Report...</div>

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-6 w-6" /> Financial Reports
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Analyze your profit and performance.
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
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="all-time">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* P&L Cards (Existing code...) */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="bg-slate-900 text-white">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">Rp {formatMoney(reportData.revenue)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">COGS (Modal)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-slate-700">Rp {formatMoney(reportData.cogs)}</div></CardContent>
                </Card>
                <Card className={reportData.grossProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-800">Gross Profit</CardTitle></CardHeader>
                    <CardContent><div className={`text-2xl font-bold ${reportData.grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>Rp {formatMoney(reportData.grossProfit)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Margin</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{reportData.margin.toFixed(1)}%</div></CardContent>
                </Card>
            </div>

            {/* Tables (Existing code...) */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" /> Best Selling Products</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.topProducts.map((p, i) => (
                                    <TableRow key={i}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right">Rp {formatMoney(p.revenue)}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PieChart className="h-4 w-4" /> Sales by Category</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.topCategories.map((c, i) => (
                                    <TableRow key={i}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-right">{reportData.revenue > 0 ? ((c.total / reportData.revenue) * 100).toFixed(0) : 0}%</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* --- EXCEL BUTTON (UPDATED) --- */}
            <div className="mt-8 text-center">
                <Button
                    onClick={handleDownloadExcel}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Download className="h-4 w-4" />
                    Download Excel Report (.xlsx)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    Includes: Summary, Transaction Log, and Inventory Status.
                </p>
            </div>
        </div>
    )
}