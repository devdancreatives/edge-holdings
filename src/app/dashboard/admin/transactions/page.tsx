'use client'

import { useQuery } from '@apollo/client/react'
import { GET_ADMIN_TRANSACTIONS } from '@/graphql/queries'
import { ArrowDownLeft, ArrowUpRight, History, User } from 'lucide-react'

export default function AdminTransactionsPage() {
    const { data, loading } = useQuery<any>(GET_ADMIN_TRANSACTIONS, { pollInterval: 30000 })

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading transactions...</div>

    const transactions = data?.adminTransactions || []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <History className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transaction Ledger</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">All platform-wide financial activities</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {transactions.map((tx: any) => {
                                const isPositive = tx.amount > 0
                                return (
                                    <tr key={tx.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors">
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                                    <User size={14} className="text-zinc-500" />
                                                </div>
                                                <div>
                                                    <div className="text-zinc-900 dark:text-white font-medium">{tx.user?.fullName || 'System'}</div>
                                                    <div className="text-xs text-zinc-500">{tx.user?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {isPositive ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {tx.type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold whitespace-nowrap ${isPositive ? 'text-green-500' : 'text-zinc-900 dark:text-white'}`}>
                                            {isPositive ? '+' : ''}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                            {tx.description}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
