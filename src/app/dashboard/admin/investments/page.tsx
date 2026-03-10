'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ADMIN_INVESTMENTS, CLOSE_INVESTMENT } from '@/graphql/queries'
import { TrendingUp, User, XCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AdminInvestmentsPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_INVESTMENTS, { pollInterval: 30000 })
    const [closeInvestment] = useMutation(CLOSE_INVESTMENT)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [confirmingId, setConfirmingId] = useState<string | null>(null)

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading investments...</div>

    const investments = data?.adminInvestments || []

    const handleClose = async (id: string, includeRoi: boolean) => {
        setProcessingId(id)
        try {
            await closeInvestment({ variables: { id, includeRoi } })
            toast.success(`Investment closed ${includeRoi ? 'with' : 'without'} ROI successfully`)
            setConfirmingId(null)
            refetch()
        } catch (error: any) {
            toast.error(error.message || 'Failed to close investment')
        } finally {
            setProcessingId(null)
        }
    }

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
                                <th className="px-6 py-4 text-right">Actions</th>
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
                                    <td className="px-6 py-4 text-right">
                                        {inv.status === 'active' && (
                                            <div className="flex justify-end items-center gap-2">
                                                {confirmingId === inv.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleClose(inv.id, true)}
                                                            disabled={processingId === inv.id}
                                                            className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded font-bold"
                                                        >
                                                            WITH ROI
                                                        </button>
                                                        <button
                                                            onClick={() => handleClose(inv.id, false)}
                                                            disabled={processingId === inv.id}
                                                            className="text-[10px] bg-zinc-500 hover:bg-zinc-600 text-white px-2 py-1 rounded font-bold"
                                                        >
                                                            NO ROI
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(null)}
                                                            className="text-zinc-400 hover:text-white"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmingId(inv.id)}
                                                        disabled={processingId === inv.id}
                                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors font-medium"
                                                    >
                                                        {processingId === inv.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <XCircle size={14} />
                                                        )}
                                                        Close
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {investments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
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
