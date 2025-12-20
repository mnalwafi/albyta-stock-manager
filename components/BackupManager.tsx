"use client"

import { useRef } from "react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Download, Upload, Database } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function BackupManager() {
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- 1. EXPORT FUNCTION ---
    const handleExport = async () => {
        try {
            const data = await db.transaction('r', db.stocks, db.transactions, async () => {
                const stocks = await db.stocks.toArray()
                const transactions = await db.transactions.toArray()
                return { stocks, transactions, version: 3, exportedAt: new Date() }
            })

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            const dateStr = new Date().toISOString().split('T')[0]
            link.download = `backup-stok-${dateStr}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            alert("Backup berhasil diunduh!") // Translated
        } catch (error) {
            console.error("Export failed:", error)
            alert("Gagal mengekspor data.") // Translated
        }
    }

    // --- 2. IMPORT FUNCTION ---
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const confirmed = confirm(
            "⚠️ PERINGATAN: Ini akan MENGHAPUS data saat ini dan menggantinya dengan file backup.\n\nApakah Anda yakin ingin melanjutkan?" // Translated
        )

        if (!confirmed) {
            if (fileInputRef.current) fileInputRef.current.value = "" 
            return
        }

        const reader = new FileReader()

        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)

                if (!json.stocks || !json.transactions) {
                    throw new Error("Format file backup tidak valid") // Translated
                }

                await db.transaction('rw', db.stocks, db.transactions, async () => {
                    // A. Wipe current DB
                    await db.stocks.clear()
                    await db.transactions.clear()

                    // B. Restore Stocks
                    const stocksToRestore = json.stocks.map((s: any) => ({
                        ...s,
                        updatedAt: new Date(s.updatedAt) 
                    }))

                    // C. Restore Transactions
                    const txToRestore = json.transactions.map((t: any) => ({
                        ...t,
                        date: new Date(t.date) 
                    }))

                    // D. Bulk Add
                    await db.stocks.bulkAdd(stocksToRestore)
                    await db.transactions.bulkAdd(txToRestore)
                })

                alert("Data berhasil dipulihkan! Halaman akan dimuat ulang.") // Translated
                window.location.reload()

            } catch (error) {
                console.error("Import failed:", error)
                alert("Gagal memulihkan data. File mungkin rusak.") // Translated
            }
        }

        reader.readAsText(file)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Pengaturan Data">
                    <Database className="h-4 w-4 text-slate-600" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manajemen Data</DialogTitle> {/* Translated */}
                    <DialogDescription>
                        Cadangkan data Anda ke file JSON atau pulihkan dari cadangan sebelumnya. {/* Translated */}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* EXPORT AREA */}
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-green-50 border-green-200">
                        <h3 className="font-semibold text-green-800 flex items-center gap-2">
                            <Download className="h-4 w-4" /> Ekspor Data (Backup) {/* Translated */}
                        </h3>
                        <p className="text-sm text-green-700">
                            Unduh salinan database ke komputer Anda. Lakukan secara rutin! {/* Translated */}
                        </p>
                        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white w-full mt-2">
                            Unduh Backup (.json) {/* Translated */}
                        </Button>
                    </div>

                    {/* IMPORT AREA */}
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-red-50 border-red-200">
                        <h3 className="font-semibold text-red-800 flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Pulihkan Data (Restore) {/* Translated */}
                        </h3>
                        <p className="text-sm text-red-700">
                            Unggah file backup. <span className="font-bold">Peringatan: Data saat ini akan ditimpa.</span> {/* Translated */}
                        </p>

                        <div className="mt-2">
                            <input
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImport}
                            />
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Pilih File Backup untuk Dipulihkan {/* Translated */}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}