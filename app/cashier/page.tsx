"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, Transaction, type StockItem } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Type for items in the Cart (extends StockItem with a 'cartQty')
interface CartItem extends StockItem {
    cartQty: number;
}

export default function CashierPage() {
    const router = useRouter()
    const stocks = useLiveQuery(() => db.stocks.toArray())
    const customers = useLiveQuery(() => db.customers.toArray())

    // Local States
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [rawPayment, setRawPayment] = useState(0) // For Math
    const [displayPayment, setDisplayPayment] = useState("")
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in")
    const [isDebt, setIsDebt] = useState(false)

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip non-digits
        const value = e.target.value

        const numberString = value.replace(/[^0-9]/g, "")

        if (!numberString) {
            setDisplayPayment("")
            setRawPayment(0)
            return
        }

        const num = parseInt(numberString, 10)
        setRawPayment(num)
        setDisplayPayment(num.toLocaleString("id-ID"))
    }

    // --- CART LOGIC ---

    const addToCart = (item: StockItem) => {
        // Check if item is already in cart
        const existing = cart.find(c => c.id === item.id)

        if (existing) {
            // If already in cart, check if we have enough stock
            if (existing.cartQty >= item.quantity) {
                alert("Not enough stock!")
                return
            }
            setCart(cart.map(c => c.id === item.id ? { ...c, cartQty: c.cartQty + 1 } : c))
        } else {
            // Add new item with qty 1
            if (item.quantity < 1) {
                alert("Out of stock!")
                return
            }
            setCart([...cart, { ...item, cartQty: 1 }])
        }
    }

    const removeFromCart = (id: number) => {
        setCart(cart.filter(c => c.id !== id))
    }

    const updateQty = (id: number, delta: number) => {
        setCart(cart.map(c => {
            if (c.id === id) {
                const newQty = c.cartQty + delta
                // Prevent going below 1 or above actual stock
                if (newQty < 1) return c
                if (newQty > c.quantity) return c
                return { ...c, cartQty: newQty }
            }
            return c
        }))
    }

    // --- CHECKOUT LOGIC (The Transaction) ---

    const handleCheckout = async () => {
        if (cart.length === 0) return

        // Validation: Cannot do debt for "Walk-in" (Unknown) customer
        if (isDebt && selectedCustomerId === "walk-in") {
            alert("Error: Please select a specific Customer for Kasbon.")
            return
        }

        try {
            await db.transaction('rw', db.stocks, db.transactions, db.customers, async () => {

                // 1. Handle Stock (Existing)
                for (const item of cart) {
                    const currentStock = await db.stocks.get(item.id)
                    if (currentStock) {
                        await db.stocks.update(item.id, { quantity: currentStock.quantity - item.cartQty })
                    }
                }

                // 2. Handle Debt (New)
                if (isDebt && selectedCustomerId !== "walk-in") {
                    const cId = parseInt(selectedCustomerId)
                    const customer = await db.customers.get(cId)
                    if (customer) {
                        await db.customers.update(cId, {
                            totalDebt: customer.totalDebt + cartTotal
                        })
                    }
                }

                // 3. Save Transaction (Updated)
                await db.transactions.add({
                    date: new Date(),
                    total: cartTotal,
                    payment: isDebt ? 0 : rawPayment, // If debt, cash paid is 0
                    change: isDebt ? 0 : change,
                    customerId: selectedCustomerId === "walk-in" ? undefined : parseInt(selectedCustomerId), // Save link
                    isDebt: isDebt, // Save status
                    items: cart.map(item => ({
                        stockId: item.id, name: item.name, qty: item.cartQty, price: item.price, costPrice: item.costPrice || 0
                    }))
                })
            })

            alert("Transaction Successful!")
            // Reset
            setCart([]); setRawPayment(0); setDisplayPayment(""); setIsDebt(false); setSelectedCustomerId("walk-in")

        } catch (error) { console.error(error); alert("Failed.") }
    }

    // --- CALCULATIONS ---

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.cartQty), 0)
    const change = rawPayment - cartTotal // Use rawPayment instead of paymentAmount

    // Filter products for the grid
    const filteredStocks = stocks?.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.sku.toLowerCase().includes(search.toLowerCase())
    )

    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)

    const CartSidebarContent = (
        <div className="flex flex-col h-full">
            {/* Cart Items List */}
            <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                        <ShoppingCart className="h-12 w-12 opacity-20" />
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Rp {formatMoney(item.price)} x {item.cartQty}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm w-4 text-center font-bold">{item.cartQty}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 ml-1" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Payment Section */}
            <div className="p-4 border-t bg-slate-50 space-y-4">
                {/* CUSTOMER SELECTOR */}
                <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="walk-in">Walk-in Customer (General)</SelectItem>
                            {customers?.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.name} {c.totalDebt > 0 ? `(Hutang: ${formatMoney(c.totalDebt)})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between bg-white p-3 rounded border">
                    <Label htmlFor="debt-mode" className="cursor-pointer">
                        {isDebt ? "🔴 KASBON (Hutang)" : "🟢 Cash Payment"}
                    </Label>
                    <Switch id="debt-mode" checked={isDebt} onCheckedChange={setIsDebt} />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rp {formatMoney(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-900">
                        <span>Total</span>
                        <span>Rp {formatMoney(cartTotal)}</span>
                    </div>
                </div>

                {/* Cash Input Section */}
                {!isDebt && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative flex flex-col justofy-start gap-1">
                            <span className="text-xs font-bold text-muted-foreground">
                                Cash (Rp)
                            </span>
                            <Input
                                id="price"
                                type="text" // Changed from 'number' to 'text'
                                placeholder="0"
                                className="font-bold text-lg"
                                value={displayPayment}
                                onChange={handlePaymentChange}
                            />
                        </div>

                        <div className="relative flex flex-col justofy-start gap-1">
                            <span className="text-xs font-bold text-muted-foreground">
                                Change (Rp)
                            </span>
                            <Input
                                type="text"
                                placeholder="0"
                                className={`text-right font-bold text-lg ${change < 0 ? 'text-red-500' : 'text-green-600'} !opacity-100`} /* pl-16 gives room for the label */
                                value={new Intl.NumberFormat("id-ID").format(change < 0 ? 0 : change)}
                                readOnly={true}
                            />
                        </div>
                    </div>
                )}

                {/* Update the Button Disabled Logic */}
                <Button
                    size="lg"
                    className={`w-full mt-4 ${isDebt ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={cart.length === 0 || (!isDebt && rawPayment < cartTotal)}
                    onClick={handleCheckout}
                >
                    {isDebt ? "Confirm Kasbon" : "Complete Order"}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-slate-50">

            {/* --- LEFT: PRODUCT CATALOG --- */}
            <div className="flex-1 flex flex-col p-4 gap-4 h-full overflow-hidden relative">

                {/* Header & Search */}
                <div className="flex gap-4 items-center">
                    <Button variant="outline" size="icon" onClick={() => router.push("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Item Name or SKU..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {filteredStocks?.map(item => (
                            <Card
                                key={item.id}
                                className={`cursor-pointer hover:border-blue-500 transition-all active:scale-95 ${item.quantity === 0 ? 'opacity-50 grayscale' : ''}`}
                                onClick={() => addToCart(item)}
                            >
                                <CardHeader className="p-4 pb-2">
                                    <h3 className="font-semibold truncate" title={item.name}>{item.name}</h3>
                                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-lg font-bold text-slate-700">Rp {formatMoney(item.price)}</div>
                                    <div className={`text-xs mt-1 ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                        Stock: {item.quantity} {item.unit}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
                <div className="md:hidden absolute bottom-6 right-6 z-50">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="lg" className="rounded-full shadow-xl h-14 px-6 bg-blue-600">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {cart.length} Items
                                <span className="ml-2 bg-blue-800 px-2 py-0.5 rounded text-xs">
                                    Rp {formatMoney(cartTotal)}
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] p-0">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle>Current Order</SheetTitle>
                            </SheetHeader>
                            {CartSidebarContent}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* --- RIGHT: CART / SIDEBAR --- */}
            <div className="hidden md:flex w-[400px] bg-white border-l flex-col h-full shadow-xl z-10">
                <div className="p-4 border-b bg-slate-50">
                    <h2 className="font-bold flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Current Order</h2>
                </div>
                {CartSidebarContent}
            </div>
        </div>
    )
}