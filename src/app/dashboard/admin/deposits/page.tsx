'use client'

import { useQuery } from '@apollo/client/react'
import { GET_ADMIN_DEPOSITS } from '@/graphql/queries'
import { ExternalLink } from 'lucide-react'

export default function AdminDepositsPage() {
    const { data, loading } = useQuery<any>(GET_ADMIN_DEPOSITS, { pollInterval: 30000 })

    if (loading && !data) return <div className="p-8 text-zinc-400">Loading deposits...</div>

    const deposits = data?.adminDeposits || []

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Deposit History</h1>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">TX Hash</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map((d: any) => (
                                <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                    <td className="px-6 py-4 text-zinc-400">
                                        {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{d.user?.fullName}</div>
                                        <div className="text-xs text-zinc-500">{d.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-green-400 font-medium">
                                        +{d.amount.toFixed(2)} USDT
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                                        <span className="mr-2">{d.txHash.slice(0, 10)}...</span>
                                        <a href={`https://bscscan.com/tx/${d.txHash}`} target="_blank" className="text-blue-500 hover:text-blue-400">
                                            <ExternalLink size={12} className="inline" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                            {d.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
