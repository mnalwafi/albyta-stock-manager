"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"
import { DollarSign, Package, AlertTriangle } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardAnalytics() {
    // 1. Fetch Data Live
    const stocks = useLiveQuery(() => db.stocks.toArray())

    if (!stocks) return <div className="h-40 flex items-center justify-center">Loading analytics...</div>

    // 2. Calculate KPI Metrics
    const totalProducts = stocks.length

    const totalValue = stocks.reduce((acc, item) => {
        return acc + (item.price * item.quantity)
    }, 0)

    const lowStockCount = stocks.filter(item => item.quantity < 10).length // Threshold: 10 units

    // 3. Prepare Data for Charts

    // Group by Category for Pie Chart
    const categoryDataMap = stocks.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity
        return acc
    }, {})

    const pieData = Object.keys(categoryDataMap).map(key => ({
        name: key,
        value: categoryDataMap[key]
    }))

    // Top 5 Items by Quantity for Bar Chart
    const barData = [...stocks]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

    // Helper for Currency
    const formatCurrency = (n: number) => new Intl.NumberFormat("id-ID", { notation: "standard" }).format(n)

    return (
        <div className="space-y-4">
            {/* --- KPI CARDS --- */}
            <div className="grid gap-4 md:grid-cols-3">

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on current stock price
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts} Items</div>
                        <p className="text-xs text-muted-foreground">
                            In {Object.keys(categoryDataMap).length} categories
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Items with &lt; 10 units
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- CHARTS SECTION --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Bar Chart: Top Stock Levels */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Highest Stock Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="quantity" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart: Categories */}
                <Card className="col-span-4 md:col-span-3">
                    <CardHeader>
                        <CardTitle>Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 text-xs text-muted-foreground -mt-4 flex-wrap">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}