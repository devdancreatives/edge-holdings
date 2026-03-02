'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ADMIN_WITHDRAWALS, ADMIN_UPDATE_WITHDRAWAL } from '@/graphql/queries'
import { Check, X, Clock, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function AdminWithdrawalsPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_WITHDRAWALS, { pollInterval: 10000 })
    const [updateStatus] = useMutation(ADMIN_UPDATE_WITHDRAWAL)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleAction = async (id: string, status: 'completed' | 'rejected', txHash?: string) => {
        if (!confirm(`Are you sure you want to mark this as ${status}?`)) return

        setProcessingId(id)
        try {
            await updateStatus({
                variables: {
                    id,
                    status,
                    txHash
                }
            })
            await refetch()
        } catch (e) {
            alert('Error updating status')
            console.error(e)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading && !data) return <div className="p-8 text-zinc-400">Loading withdrawals...</div>

    const withdrawals = data?.adminWithdrawals || []

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Address</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((w: any) => (
                                <tr key={w.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                    <td className="px-6 py-4 text-zinc-400">
                                        {new Date(w.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{w.user?.fullName}</div>
                                        <div className="text-xs text-zinc-500">{w.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-white font-medium">
                                        {w.amount.toFixed(2)} USDT
                                        <span className="block text-xs text-red-400">Fee: {w.fee}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                                        {w.walletAddress}
                                        <a href={`https://bscscan.com/address/${w.walletAddress}`} target="_blank" className="ml-2 text-blue-500 hover:text-blue-400">
                                            <ExternalLink size={12} className="inline" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${w.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                            w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {w.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {w.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        const tx = prompt("Enter TX Hash (Optional)")
                                                        handleAction(w.id, 'completed', tx || undefined)
                                                    }}
                                                    disabled={processingId === w.id}
                                                    className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(w.id, 'rejected')}
                                                    disabled={processingId === w.id}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {w.status === 'completed' && w.txHash && (
                                            <a href={`https://bscscan.com/tx/${w.txHash}`} target="_blank" className="text-blue-500 hover:text-blue-400 text-xs">
                                                View TX
                                            </a>
                                        )}
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
