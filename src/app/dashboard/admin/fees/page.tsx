'use client'

import { useQuery } from '@apollo/client/react'
import { GET_ADMIN_FEES } from '@/graphql/queries'
import { DollarSign, User, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

export default function AdminFeesPage() {
    const { data, loading } = useQuery<any>(GET_ADMIN_FEES, { pollInterval: 30000 })

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading platform fees...</div>

    const fees = data?.adminFees || []
    const totalCollected = fees.reduce((sum: number, f: any) => sum + f.amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Platform Fees</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Detailed breakdown of all fees collected from platform activities</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-6 py-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Collected</p>
                        <p className="text-2xl font-bold text-yellow-500">${totalCollected.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Fee Amount</th>
                                <th className="px-6 py-4">Transaction Amount</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {fees.map((fee: any) => (
                                <tr key={fee.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="text-zinc-900 dark:text-white font-medium">{fee.user?.fullName || 'Unknown User'}</div>
                                                <div className="text-xs text-zinc-500">{fee.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                            fee.type === 'investment'
                                                ? "bg-blue-500/10 text-blue-500"
                                                : "bg-purple-500/10 text-purple-500"
                                        )}>
                                            {fee.type === 'investment' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                            <span className="capitalize">{fee.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-zinc-900 dark:text-white font-bold text-base">
                                            ${fee.amount.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        ${fee.originalAmount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {new Date(fee.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {fees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No fees collected yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
