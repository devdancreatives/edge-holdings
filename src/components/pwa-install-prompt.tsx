
'use client'

import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'
import { toast } from 'sonner'

export function PwaInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIosDevice)

        // Check standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone

        if (isStandalone) return // Already installed

        // Android / Desktop Chrome handling
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setInstallPrompt(e)
            // Show prompt after a delay to not be annoying
            setTimeout(() => setIsVisible(true), 1000)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // iOS detection - showing prompt if not standalone
        if (isIosDevice && !isStandalone) {
            // Show every time on refresh to be more frequent as requested
            setTimeout(() => setIsVisible(true), 1000)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstall = async () => {
        if (installPrompt) {
            installPrompt.prompt()
            const { outcome } = await installPrompt.userChoice
            if (outcome === 'accepted') {
                setInstallPrompt(null)
                setIsVisible(false)
            }
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        // No longer setting sessionStorage to allow prompt to reappear on refresh
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
            <div className="bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-4 shadow-2xl flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Install App</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {isIOS
                                ? "Install EdgePoint Holdings for a better experience."
                                : "Install our app for faster access and better performance."}
                        </p>
                    </div>
                    <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {isIOS ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                        Tap <Share className="inline w-4 h-4 mx-1" /> then "Add to Home Screen"
                    </div>
                ) : (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-medium py-2 rounded-lg transition-colors"
                    >
                        Install Now
                    </button>
                )}
            </div>
        </div>
    )
}
