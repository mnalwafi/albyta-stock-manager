"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Users, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CustomersPage() {
    const router = useRouter()
    const customers = useLiveQuery(() => db.customers.toArray())

    const [isOpen, setIsOpen] = useState(false)
    const [newName, setNewName] = useState("")
    const [newPhone, setNewPhone] = useState("")

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        await db.customers.add({
            name: newName,
            phone: newPhone,
            totalDebt: 0,
            updatedAt: new Date()
        })
        setNewName(""); setNewPhone(""); setIsOpen(false)
    }

    const handleDelete = async (id: number) => {
        if (confirm("Hapus pelanggan ini? Riwayat transaksi tetap ada, tapi data kontak akan hilang.")) { // Translated
            await db.customers.delete(id)
        }
    }

    const formatMoney = (n: number) => new Intl.NumberFormat("id-ID").format(n)

    return (
        <div className="flex flex-1 flex-col gap-4 mt-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" /> Daftar Pelanggan {/* Translated */}
                        </h1>
                        <p className="text-muted-foreground text-sm">Kelola kontak dan hutang piutang</p> {/* Translated */}
                    </div>
                </div>

                {/* Add Customer Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan</Button></DialogTrigger> {/* Translated */}
                    <DialogContent>
                        <DialogHeader><DialogTitle>Pelanggan Baru</DialogTitle></DialogHeader> {/* Translated */}
                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <Input placeholder="Nama (Contoh: Pak Budi)" value={newName} onChange={e => setNewName(e.target.value)} required /> {/* Translated */}
                            <Input placeholder="Telepon / WA (Opsional)" value={newPhone} onChange={e => setNewPhone(e.target.value)} /> {/* Translated */}
                            <Button type="submit" className="w-full">Simpan</Button> {/* Translated */}
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead> {/* Translated */}
                            <TableHead>Telepon</TableHead> {/* Translated */}
                            <TableHead className="text-right">Total Kasbon (Hutang)</TableHead> {/* Translated */}
                            <TableHead className="text-center">Aksi</TableHead> {/* Translated */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers?.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.phone || "-"}</TableCell>
                                <TableCell className={`text-right font-bold ${c.totalDebt > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                    Rp {formatMoney(c.totalDebt)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                                        <Trash2 className="h-4 w-4 text-red-400" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}