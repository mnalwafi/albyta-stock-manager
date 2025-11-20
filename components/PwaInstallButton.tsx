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
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        // 2. Check if iOS
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)

        // 3. Listen for the Install Prompt
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    // If already installed, don't show button
    if (isStandalone) return null

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === "accepted") setDeferredPrompt(null)
        }
    }

    // RENDER LOGIC:
    // If we have the prompt -> Show simple button
    // If we DON'T have prompt -> Show button that opens Help Dialog

    if (deferredPrompt) {
        return (
            <div className="px-2">
                <Button onClick={handleInstallClick} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    <Download className="h-4 w-4" /> Install App
                </Button>
            </div>
        )
    }

    // Fallback: Instructions Dialog
    return (
        <div className="px-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 text-slate-600">
                        <Smartphone className="h-4 w-4" /> Install App
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install Ngatur Stok</DialogTitle>
                        <DialogDescription>
                            Install this app on your home screen for a better experience.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        {isIOS ? (
                            <div className="p-4 bg-slate-100 rounded-lg text-sm">
                                <p className="mb-2 font-bold">iOS (Safari):</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Tap the <strong>Share</strong> button (Square with arrow)</li>
                                    <li>Scroll down</li>
                                    <li>Tap <strong>Add to Home Screen</strong></li>
                                </ol>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-100 rounded-lg text-sm">
                                <p className="mb-2 font-bold">Android (Chrome):</p>
                                <ol className="list-decimal list-inside space-y-1">
                                    <li>Tap the <strong>Three Dots</strong> menu (Top Right)</li>
                                    <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong></li>
                                </ol>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}