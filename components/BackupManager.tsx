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
            link.download = `stock-backup-${dateStr}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            alert("Backup downloaded successfully!")
        } catch (error) {
            console.error("Export failed:", error)
            alert("Failed to export data.")
        }
    }

    // --- 2. IMPORT FUNCTION ---
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const confirmed = confirm(
            "⚠️ DANGER ZONE: This will WIPE your current data and replace it with the backup file.\n\nAre you sure you want to proceed?"
        )

        if (!confirmed) {
            if (fileInputRef.current) fileInputRef.current.value = "" // Reset input
            return
        }

        const reader = new FileReader()

        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)

                // Validation: Check if it looks like our backup
                if (!json.stocks || !json.transactions) {
                    throw new Error("Invalid backup file format")
                }

                await db.transaction('rw', db.stocks, db.transactions, async () => {
                    // A. Wipe current DB
                    await db.stocks.clear()
                    await db.transactions.clear()

                    // B. Restore Stocks (Fixing Dates)
                    const stocksToRestore = json.stocks.map((s: any) => ({
                        ...s,
                        updatedAt: new Date(s.updatedAt) // Convert String -> Date
                    }))

                    // C. Restore Transactions (Fixing Dates)
                    const txToRestore = json.transactions.map((t: any) => ({
                        ...t,
                        date: new Date(t.date) // Convert String -> Date
                    }))

                    // D. Bulk Add
                    await db.stocks.bulkAdd(stocksToRestore)
                    await db.transactions.bulkAdd(txToRestore)
                })

                alert("Data restored successfully! The page will now reload.")
                window.location.reload()

            } catch (error) {
                console.error("Import failed:", error)
                alert("Failed to restore data. File might be corrupted.")
            }
        }

        reader.readAsText(file)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Data Settings">
                    <Database className="h-4 w-4 text-slate-600" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Data Management</DialogTitle>
                    <DialogDescription>
                        Backup your data to a JSON file or restore from a previous backup.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* EXPORT AREA */}
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-green-50 border-green-200">
                        <h3 className="font-semibold text-green-800 flex items-center gap-2">
                            <Download className="h-4 w-4" /> Export Data
                        </h3>
                        <p className="text-sm text-green-700">
                            Download a copy of your database to your computer. Do this weekly!
                        </p>
                        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white w-full mt-2">
                            Download Backup (.json)
                        </Button>
                    </div>

                    {/* IMPORT AREA */}
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-red-50 border-red-200">
                        <h3 className="font-semibold text-red-800 flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Restore Data
                        </h3>
                        <p className="text-sm text-red-700">
                            Upload a backup file. <span className="font-bold">Warning: This wipes current data.</span>
                        </p>

                        <div className="mt-2">
                            {/* Hidden Input Triggered by Button */}
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
                                Select Backup File to Restore
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}