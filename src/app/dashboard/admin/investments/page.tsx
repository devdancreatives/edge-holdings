'use client'

import { useQuery } from '@apollo/client/react'
import { GET_ADMIN_INVESTMENTS } from '@/graphql/queries'
import { TrendingUp, User } from 'lucide-react'

export default function AdminInvestmentsPage() {
    const { data, loading } = useQuery<any>(GET_ADMIN_INVESTMENTS, { pollInterval: 30000 })

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading investments...</div>

    const investments = data?.adminInvestments || []

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Active Investments</h1>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">End Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investments.map((inv: any) => (
                                <tr key={inv.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800/20">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="text-zinc-900 dark:text-white font-medium">{inv.user?.fullName}</div>
                                                <div className="text-xs text-zinc-500">{inv.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">
                                        ${inv.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {inv.durationMonths} months
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {new Date(inv.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {new Date(inv.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                            {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {investments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        No active investments found
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
