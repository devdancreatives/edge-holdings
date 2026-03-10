'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    LayoutDashboard,
    Wallet,
    TrendingUp,
    TrendingDown,
    History,
    Settings,
    LogOut,
    User,
    Users,
    FileText,
    Shield,
    Menu,
    X,
    MessageSquare,
    Bell,
    BellOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useQuery, useApolloClient } from '@apollo/client/react'
import { GET_ME } from '@/graphql/queries'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'


function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

const baseNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invest', href: '/dashboard/invest', icon: TrendingUp },
    { name: 'PIF', href: '/dashboard/pif', icon: TrendingUp },
    { name: 'AI Trading', href: '/dashboard/ai-trading', icon: TrendingUp },
    { name: 'Investments', href: '/dashboard/investments', icon: History },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Deposits', href: '/dashboard/deposits', icon: TrendingDown },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
    { name: 'Referrals', href: '/dashboard/referrals', icon: Users },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function NotificationToggle() {
    const { isSubscribed, subscribeToPush, unsubscribeFromPush, permission } = usePushNotifications()

    if (permission === 'denied') return null

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribeFromPush()
        } else {
            await subscribeToPush()
        }
    }

    return (
        <button
            onClick={handleToggle}
            className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isSubscribed
                    ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-yellow-500 hover:bg-yellow-500/10'
            )}
        >
            {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
            {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
        </button>
    )
}

const SidebarContent: React.FC<{
    navItems: typeof baseNavItems
    pathname: string
    setMobileMenuOpen: (open: boolean) => void
    handleSignOut: () => void
}> = ({ navItems, pathname, setMobileMenuOpen, handleSignOut }) => (
    <div className="flex flex-col h-full w-full relative">
        <div className="pt-16 lg:pt-4 px-4 mb-10 flex items-center justify-between gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-9 w-9 transition-transform group-hover:scale-105">
                    <Image src="/logo-v4.png" alt="EdgePoint Holdings" fill className="object-contain" />
                </div>






                <span className="text-lg font-bold bg-linear-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">EdgePoint Holdings</span>
            </Link>
            <ThemeToggle />
        </div>



        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 px-3 pb-32 scrollbar-none">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                            isActive
                                ? 'bg-linear-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-500 shadow-lg shadow-yellow-500/10'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white hover:translate-x-1'
                        )}
                    >
                        {Icon && <Icon size={20} />}
                        {item.name}
                    </Link>
                )
            })}
        </nav>

        <div className="px-3 pb-2 z-50">
            <NotificationToggle />
        </div>

        <div className="fixed bottom-0 left-0 w-64 p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-linear-to-t from-white via-white/95 to-white/0 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-950/0 backdrop-blur-sm z-50 border-r border-zinc-200 dark:border-zinc-800">
            <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 dark:hover:text-red-300 transition-all duration-200"
            >
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
    </div>
)

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { session, loading } = useAuth()
    const client = useApolloClient()

    const { data } = useQuery<any>(GET_ME, {
        skip: loading || !session
    })
    const userRole = data?.me?.role || 'user'

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        await client.clearStore()
        router.push('/login')
    }

    const navItems = userRole === 'admin'
        ? [
            ...baseNavItems,
            { name: 'Admin Users', href: '/dashboard/admin', icon: Shield },
            { name: 'House Profit', href: '/dashboard/admin/ai-trading', icon: TrendingUp }
        ]
        : baseNavItems

    return (
        <>
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white transition-transform duration-300 overflow-hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <SidebarContent
                    navItems={navItems}
                    pathname={pathname || ''}
                    setMobileMenuOpen={setMobileMenuOpen}
                    handleSignOut={handleSignOut}
                />
            </div>
        </>
    )
}
