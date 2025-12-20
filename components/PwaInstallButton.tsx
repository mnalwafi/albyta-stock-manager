"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function PwaInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        const isIOSStandalone = (window.navigator as any).standalone === true

        if (isStandalone || isIOSStandalone) {
            setIsInstalled(true)
            return
        }

        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    if (isInstalled) return null

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === "accepted") setDeferredPrompt(null)
        }
    }

    // Scenario A: Android/Chrome (Automatic)
    if (deferredPrompt) {
        return (
            <div className="px-2">
                <Button onClick={handleInstallClick} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    <Download className="h-4 w-4" /> Install Aplikasi {/* Translated */}
                </Button>
            </div>
        )
    }

    // Scenario B: iOS or Manual Fallback
    return (
        <div className="px-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 text-slate-600 border-dashed">
                        <Smartphone className="h-4 w-4" /> Install Aplikasi {/* Translated */}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install Ngatur Stok</DialogTitle>
                        <DialogDescription>
                            Dapatkan pengalaman aplikasi layar penuh. {/* Translated */}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        {isIOS ? (
                            <div className="p-4 bg-slate-100 rounded-lg text-sm">
                                <p className="mb-2 font-bold">iOS (Safari):</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Ketuk tombol <strong>Share</strong> (Kotak dengan panah ke atas)</li> {/* Translated */}
                                    <li>Gulir ke bawah</li> {/* Translated */}
                                    <li>Pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama)</li> {/* Translated */}
                                </ol>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-100 rounded-lg text-sm">
                                <p className="mb-2 font-bold">Android (Chrome):</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Ketuk menu <strong>Titik Tiga</strong> (Kanan Atas)</li> {/* Translated */}
                                    <li>Pilih <strong>Install App</strong> atau <strong>Add to Home Screen</strong></li> {/* Translated */}
                                </ol>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}