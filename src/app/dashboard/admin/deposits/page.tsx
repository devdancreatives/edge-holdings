'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
    GET_ADMIN_DEPOSITS,
    ADMIN_APPROVE_DEPOSIT,
    ADMIN_DECLINE_DEPOSIT
} from '@/graphql/queries'
import { CheckCircle2, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Deposit = {
    id: string
    amount: number
    txHash: string
    status: 'pending' | 'confirmed' | 'declined'
    declineReason?: string | null
    submittedByUser?: boolean
    createdAt: string
    user?: { id: string; email: string; fullName: string } | null
}

const statusBadge = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    declined: 'bg-red-500/10 text-red-500 border-red-500/20',
    failed: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
}

export default function AdminDepositsPage() {
    const [declineModal, setDeclineModal] = useState<{ id: string; email: string; amount: number } | null>(null)
    const [declineReason, setDeclineReason] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [actingId, setActingId] = useState<string | null>(null)

    const { data, loading, refetch } = useQuery<{ adminDeposits: Deposit[] }>(GET_ADMIN_DEPOSITS, {
        pollInterval: 15000
    })

    const [approveDeposit] = useMutation(ADMIN_APPROVE_DEPOSIT, {
        onCompleted: () => {
            toast.success('Deposit approved and balance credited.')
            setActingId(null)
            refetch()
        },
        onError: (err) => {
            toast.error(err.message)
            setActingId(null)
        }
    })

    const [declineDeposit] = useMutation(ADMIN_DECLINE_DEPOSIT, {
        onCompleted: () => {
            toast.success('Deposit declined.')
            setDeclineModal(null)
            setDeclineReason('')
            setActingId(null)
            refetch()
        },
        onError: (err) => {
            toast.error(err.message)
            setActingId(null)
        }
    })

    const handleApprove = async (id: string) => {
        setActingId(id)
        await approveDeposit({ variables: { id } })
    }

    const handleDeclineSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!declineModal || !declineReason.trim()) return
        setActingId(declineModal.id)
        await declineDeposit({ variables: { id: declineModal.id, reason: declineReason.trim() } })
    }

    const deposits = data?.adminDeposits || []
    const pending = deposits.filter(d => d.status === 'pending')
    const others = deposits.filter(d => d.status !== 'pending')

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-40 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading deposits...
            </div>
        )
    }

    const DepositRow = ({ d }: { d: Deposit }) => {
        const isExpanded = expandedId === d.id
        const isPending = d.status === 'pending'
        const isActing = actingId === d.id
        const badge = statusBadge[d.status as keyof typeof statusBadge] || statusBadge.failed

        return (
            <>
                <tr
                    className={`border-b border-zinc-200 dark:border-zinc-800/50 transition-colors ${isPending ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}`}
                >
                    <td className="px-4 py-4 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()}{' '}
                        <span className="opacity-60">{new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-4">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">{d.user?.fullName || '—'}</div>
                        <div className="text-xs text-zinc-500">{d.user?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-4">
                        <span className="text-base font-bold text-green-500">+{d.amount.toFixed(2)}</span>
                        <span className="text-xs text-zinc-500 ml-1">USDT</span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                            <span>{d.txHash.slice(0, 8)}...{d.txHash.slice(-6)}</span>
                            <a
                                href={`https://bscscan.com/tx/${d.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-400 transition-colors"
                                title="View on BscScan"
                            >
                                <ExternalLink size={11} />
                            </a>
                        </div>
                    </td>
                    <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${badge}`}>
                            {d.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {d.status === 'confirmed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {d.status === 'declined' && <XCircle className="h-3 w-3 mr-1" />}
                            {d.status.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-4 py-4">
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleApprove(d.id)}
                                    disabled={isActing}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-semibold border border-green-500/20 transition-colors disabled:opacity-50"
                                >
                                    {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => {
                                        setDeclineModal({ id: d.id, email: d.user?.email || '', amount: d.amount })
                                        setDeclineReason('')
                                    }}
                                    disabled={isActing}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold border border-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="h-3 w-3" />
                                    Decline
                                </button>
                            </div>
                        ) : d.status === 'declined' && d.declineReason ? (
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                Reason {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                        ) : (
                            <span className="text-xs text-zinc-600">—</span>
                        )}
                    </td>
                </tr>
                {isExpanded && d.declineReason && (
                    <tr className="bg-red-500/5 border-b border-zinc-200 dark:border-zinc-800/50">
                        <td colSpan={6} className="px-4 py-3">
                            <p className="text-xs text-red-400">
                                <span className="font-semibold">Decline reason: </span>{d.declineReason}
                            </p>
                        </td>
                    </tr>
                )}
            </>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Deposits</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Review and approve user deposit requests
                    </p>
                </div>
                {pending.length > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-semibold border border-yellow-500/20">
                        <Clock className="h-4 w-4" />
                        {pending.length} pending
                    </span>
                )}
            </div>

            {/* Pending Section */}
            {pending.length > 0 && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-yellow-500/20 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <h2 className="text-sm font-semibold text-yellow-500">Pending Review ({pending.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-yellow-500/5">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">TX Hash</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map(d => <DepositRow key={d.id} d={d} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Deposits */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">All Deposits</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">TX Hash</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map(d => <DepositRow key={d.id} d={d} />)}
                            {deposits.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        No deposits yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Decline Modal */}
            {declineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-full bg-red-500/10">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Decline Deposit</h3>
                        </div>
                        <p className="text-sm text-zinc-500 mb-5">
                            Declining <strong className="text-zinc-700 dark:text-zinc-300">${declineModal.amount.toFixed(2)} USDT</strong> from <strong className="text-zinc-700 dark:text-zinc-300">{declineModal.email}</strong>.
                            The user will see your reason.
                        </p>
                        <form onSubmit={handleDeclineSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Reason for Declining</label>
                                <textarea
                                    value={declineReason}
                                    onChange={e => setDeclineReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                                    placeholder="e.g. Transaction not found on BSCScan, invalid amount, etc."
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setDeclineModal(null); setDeclineReason('') }}
                                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!declineReason.trim() || !!actingId}
                                    className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                    {actingId ? 'Declining...' : 'Decline Deposit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
