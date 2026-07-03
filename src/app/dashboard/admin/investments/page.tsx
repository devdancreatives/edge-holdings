'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ADMIN_INVESTMENTS, CLOSE_INVESTMENT, TOGGLE_INVESTMENT_PAUSE, ADMIN_ADJUST_INVESTMENT_PROFIT } from '@/graphql/queries'
import { TrendingUp, User, XCircle, Loader2, CheckCircle2, PauseCircle, PlayCircle, Pencil, DollarSign, X } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function AdminInvestmentsPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_INVESTMENTS, { pollInterval: 30000 })
    const [closeInvestment] = useMutation(CLOSE_INVESTMENT)
    const [togglePause] = useMutation(TOGGLE_INVESTMENT_PAUSE)
    const [adjustProfit, { loading: adjusting }] = useMutation(ADMIN_ADJUST_INVESTMENT_PROFIT)

    const [processingId, setProcessingId] = useState<string | null>(null)
    const [confirmingId, setConfirmingId] = useState<string | null>(null)

    // Profit Adjustment Modal States
    const [showAdjustModal, setShowAdjustModal] = useState(false)
    const [selectedInvId, setSelectedInvId] = useState<string | null>(null)
    const [adjustmentAmount, setAdjustmentAmount] = useState('')
    const [adjustmentDesc, setAdjustmentDesc] = useState('')

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

    const handleTogglePause = async (id: string, currentlyPaused: boolean) => {
        setProcessingId(`pause-${id}`)
        try {
            await togglePause({ variables: { id } })
            toast.success(`Investment ${currentlyPaused ? 'resumed' : 'paused'} successfully`)
            refetch()
        } catch (error: any) {
            toast.error(error.message || 'Failed to toggle pause status')
        } finally {
            setProcessingId(null)
        }
    }

    const handleAdjustProfitSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(adjustmentAmount)

        if (isNaN(amount)) {
            toast.error('Please enter a valid numeric amount')
            return
        }
        if (!adjustmentDesc.trim()) {
            toast.error('Please enter a description for the ledger audit trail')
            return
        }

        try {
            await adjustProfit({
                variables: {
                    investmentId: selectedInvId,
                    amount,
                    description: adjustmentDesc.trim()
                }
            })
            toast.success('Profit adjusted successfully')
            setShowAdjustModal(false)
            setSelectedInvId(null)
            setAdjustmentAmount('')
            setAdjustmentDesc('')
            refetch()
        } catch (error: any) {
            toast.error(error.message || 'Failed to adjust profit')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Active Investments</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage user investments, pauses, maturity, and profits</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Current Profit</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Start Date</th>
                                <th className="px-6 py-4">End Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investments.map((inv: any) => (
                                <tr key={inv.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/10 transition-colors">
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
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium font-mono">
                                        ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-500 font-bold font-mono">
                                                ${(inv.expectedProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-xs text-zinc-500 font-mono">
                                                ({(inv.profitPercent || 0).toFixed(1)}%)
                                            </span>
                                            {inv.status === 'active' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedInvId(inv.id)
                                                        setAdjustmentAmount('')
                                                        setAdjustmentDesc('')
                                                        setShowAdjustModal(true)
                                                    }}
                                                    className="p-1 rounded text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors cursor-pointer"
                                                    title="Adjust profit manually"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {inv.durationMonths === 0 ? '1 hour (Test)' : `${inv.durationMonths} months`}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {new Date(inv.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {new Date(inv.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                                            inv.isPaused 
                                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
                                                : inv.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent'
                                            }`}>
                                            {inv.isPaused ? 'PAUSED' : inv.status.toUpperCase()}
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
                                                            className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                                                        >
                                                            WITH ROI
                                                        </button>
                                                        <button
                                                            onClick={() => handleClose(inv.id, false)}
                                                            disabled={processingId === inv.id}
                                                            className="text-[10px] bg-zinc-500 hover:bg-zinc-600 text-white px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                                                        >
                                                            NO ROI
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(null)}
                                                            className="text-zinc-400 hover:text-white cursor-pointer"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-4 items-center">
                                                        <button
                                                            onClick={() => handleTogglePause(inv.id, inv.isPaused)}
                                                            disabled={processingId === `pause-${inv.id}` || processingId === inv.id}
                                                            className={`inline-flex items-center gap-1 hover:opacity-85 disabled:opacity-50 transition-colors font-medium cursor-pointer ${inv.isPaused ? 'text-green-500' : 'text-orange-500'}`}
                                                        >
                                                            {processingId === `pause-${inv.id}` ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : inv.isPaused ? (
                                                                <PlayCircle size={14} />
                                                            ) : (
                                                                <PauseCircle size={14} />
                                                            )}
                                                            {inv.isPaused ? 'Resume' : 'Pause'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingId(inv.id)}
                                                            disabled={processingId === inv.id || processingId === `pause-${inv.id}`}
                                                            className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                                                        >
                                                            {processingId === inv.id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <XCircle size={14} />
                                                            )}
                                                            Close
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                             ))}
                            {investments.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                                        No active investments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profit Adjustment Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl p-6 relative">
                        <button
                            onClick={() => {
                                setShowAdjustModal(false)
                                setSelectedInvId(null)
                            }}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                            <DollarSign className="text-yellow-500 h-5 w-5" /> Adjust Investment Profit
                        </h3>
                        <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                            Specify an amount to adjust the accumulated expected profit of this investment. Positive values increase profit, negative values decrease it. This creates a matching ledger record.
                        </p>

                        <form onSubmit={handleAdjustProfitSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1.5 font-medium">
                                    Adjustment Amount (USDT)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={adjustmentAmount}
                                    onChange={e => setAdjustmentAmount(e.target.value)}
                                    placeholder="e.g. 150.00 or -50.00"
                                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1.5 font-medium">
                                    Reason / Audit Trail Memo
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={adjustmentDesc}
                                    onChange={e => setAdjustmentDesc(e.target.value)}
                                    placeholder="e.g. Strategic trade dividend payout or error correction"
                                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={adjusting}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-all disabled:opacity-50 cursor-pointer mt-6"
                            >
                                {adjusting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Submit Adjustment'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
