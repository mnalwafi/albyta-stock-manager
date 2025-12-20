"use client"

import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { TrendingUp, ShoppingCart, Wallet, LineChart } from "lucide-react"
import { format, subDays, isSameDay } from "date-fns"
import { id as idLocale } from "date-fns/locale" // Optional: for proper date formatting

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
    const transactions = useLiveQuery(() => db.transactions.toArray())
    const stocks = useLiveQuery(() => db.stocks.toArray())

    // --- DATA PROCESSING ENGINE ---
    const analytics = useMemo(() => {
        if (!transactions || !stocks) return null

        // 1. KPI: Totals
        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
        const totalTx = transactions.length
        const avgOrderValue = totalTx > 0 ? totalRevenue / totalTx : 0

        // 2. CHART: Revenue Trend (Last 7 Days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i)
            return date
        })

        const trendData = last7Days.map(date => {
            const dayTx = transactions.filter(t => isSameDay(new Date(t.date), date))
            const dailyTotal = dayTx.reduce((sum, t) => sum + t.total, 0)
            const dailyProfit = dayTx.reduce((sum, t) => {
                const cost = t.items.reduce((c, i) => c + ((i.costPrice || 0) * i.qty), 0)
                return sum + (t.total - cost)
            }, 0)

            return {
                date: format(date, "dd MMM", { locale: idLocale }), // Use ID locale if installed, otherwise remove locale
                revenue: dailyTotal,
                profit: dailyProfit
            }
        })

        // 3. CHART: Category Distribution
        const categoryMap: Record<string, number> = {}
        transactions.forEach(tx => {
            tx.items.forEach(item => {
                const stock = stocks.find(s => s.id === item.stockId)
                const cat = stock?.category || "Uncategorized"
                categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * item.qty)
            })
        })

        const categoryData = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        // 4. CHART: Hourly Activity
        const hoursMap = new Array(24).fill(0)
        transactions.forEach(tx => {
            const hour = new Date(tx.date).getHours()
            hoursMap[hour] += 1
        })
        const hourlyData = hoursMap.map((count, hour) => ({
            hour: `${hour}:00`,
            transactions: count
        }))

        return {
            totalRevenue,
            avgOrderValue,
            totalTx,
            trendData,
            categoryData,
            hourlyData
        }
    }, [transactions, stocks])

    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(n)

    if (!analytics) return <div className="p-10">Memuat Analitik...</div> // Translated

    return (
        <div className="flex flex-1 flex-col gap-6 mt-4">

            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LineChart className="h-6 w-6" />
                        Analitik Bisnis {/* Translated */}
                    </h1>
                    <p className="text-muted-foreground text-sm">Wawasan visual performa toko Anda.</p> {/* Translated */}
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Order</CardTitle> {/* Translated */}
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {formatMoney(analytics.avgOrderValue)}</div>
                        <p className="text-xs text-muted-foreground">Per transaksi pelanggan</p> {/* Translated */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle> {/* Translated */}
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalTx}</div>
                        <p className="text-xs text-muted-foreground">Jumlah penjualan seumur hidup</p> {/* Translated */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Omzet</CardTitle> {/* Translated */}
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {formatMoney(analytics.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Total Pendapatan Masuk</p> {/* Translated */}
                    </CardContent>
                </Card>
            </div>

            {/* ROW 2: MAIN TREND CHART */}
            <Card>
                <CardHeader>
                    <CardTitle>Tren Omzet & Profit (7 Hari Terakhir)</CardTitle> {/* Translated */}
                    <CardDescription>Perbandingan performa harian</CardDescription> {/* Translated */}
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRv)" name="Omzet" /> {/* Translated name prop */}
                                <Area type="monotone" dataKey="profit" stroke="#22c55e" fillOpacity={1} fill="url(#colorPf)" name="Untung" /> {/* Translated name prop */}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ROW 3: SPLIT CHARTS */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* CATEGORY PIE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Penjualan per Kategori</CardTitle> {/* Translated */}
                        <CardDescription>Grup produk mana yang paling laris?</CardDescription> {/* Translated */}
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `Rp ${formatMoney(value)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-2 -mt-4">
                                {analytics.categoryData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* HOURLY ACTIVITY BAR */}
                <Card>
                    <CardHeader>
                        <CardTitle>Jam Sibuk Toko</CardTitle> {/* Translated */}
                        <CardDescription>Jumlah transaksi berdasarkan jam</CardDescription> {/* Translated */}
                    </CardHeader>
                    <CardContent className="-ml-6 pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="transactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Transaksi" /> {/* Added translated name */}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}