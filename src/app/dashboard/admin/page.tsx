'use client'

import { useQuery } from '@apollo/client/react'
import { GET_ADMIN_STATS } from '@/graphql/queries'
import { Users, ArrowDownLeft, ArrowUpRight, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const { data, loading } = useQuery<any>(GET_ADMIN_STATS, {
        pollInterval: 10000
    })

    if (loading && !data) {
        return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading admin stats...</div>
    }

    const stats = data?.adminStats

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            href: '/dashboard/admin/users'
        },
        {
            label: 'Total Deposits',
            value: `$${stats?.totalDeposits?.toFixed(2) || '0.00'}`,
            icon: ArrowDownLeft,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            href: '/dashboard/admin/deposits'
        },
        {
            label: 'Total Withdrawals',
            value: `$${stats?.totalWithdrawals?.toFixed(2) || '0.00'}`,
            icon: ArrowUpRight,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            href: '/dashboard/admin/withdrawals'
        },
        {
            label: 'Pending Withdrawals',
            value: stats?.pendingWithdrawals || 0,
            icon: Clock,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            href: '/dashboard/admin/withdrawals'
        }
    ]

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Shield className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">System overview and management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <Link
                        key={i}
                        href={stat.href}
                        className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:bg-zinc-800 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/admin/chat"
                            className="block p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-900 dark:text-white">Support Tickets</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage user support conversations</p>
                        </Link>
                        <Link
                            href="/dashboard/admin/users"
                            className="block p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-900 dark:text-white">Manage Users</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">View user details and balances</p>
                        </Link>
                        <Link
                            href="/dashboard/admin/transactions"
                            className="block p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-900 dark:text-white">All Transactions</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Audit all platform-wide activities</p>
                        </Link>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Investment Management</h2>
                    <div className="space-y-2">
                        <Link
                            href="/dashboard/admin/investments"
                            className="block p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-900 dark:text-white">Active Investments</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">View all user investments</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
