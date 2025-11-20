"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PwaInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if it's iOS (because iOS doesn't support the install button event)
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Capture the install event
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setDeferredPrompt(null)
            setIsVisible(false)
        }
    }

    // If already installed or not supported, hide button
    if (!isVisible && !isIOS) return null

    // Render Logic
    return (
        <div className="px-2">
            {isIOS ? (
                // iOS Instructions (Since we can't auto-trigger)
                <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded mb-2">
                    To install: Tap <strong>Share</strong> <span className="inline-block border border-slate-300 px-1 rounded">⎋</span> then <strong>Add to Home Screen</strong>
                </div>
            ) : (
                // Android/Desktop Button
                isVisible && (
                    <Button
                        onClick={handleInstallClick}
                        className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Download className="h-4 w-4" /> Install App
                    </Button>
                )
            )}
        </div>
    )
}