'use client'

import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useRealtimeNotifications(user?.id)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-yellow-500">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="flex h-dvh bg-zinc-950 text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8">
                    {children}
                </div>
            </main>
            <PwaInstallPrompt />
        </div>
    )
}
