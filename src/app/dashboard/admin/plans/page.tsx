'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
    GET_ADMIN_INVESTMENT_PLANS,
    ADMIN_CREATE_INVESTMENT_PLAN,
    ADMIN_UPDATE_INVESTMENT_PLAN,
    ADMIN_TOGGLE_INVESTMENT_PLAN,
    ADMIN_DELETE_INVESTMENT_PLAN
} from '@/graphql/queries'
import { Shield, Plus, Loader2, Trash2, CheckCircle2, XCircle, ToggleLeft, ToggleRight, DollarSign, Calendar, TrendingUp, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

type InvestmentPlan = {
    id: string
    name: string
    durationMonths: number
    roiRate: number
    minAmount: number
    planType: 'standard' | 'PIF'
    isActive: boolean
    createdAt: string
}

export default function AdminPlansPage() {
    const [name, setName] = useState('')
    const [durationMonths, setDurationMonths] = useState('')
    const [roiRate, setRoiRate] = useState('')
    const [minAmount, setMinAmount] = useState('500')
    const [planType, setPlanType] = useState<'standard' | 'PIF'>('standard')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [actingId, setActingId] = useState<string | null>(null)

    const { data, loading, refetch } = useQuery<{ adminInvestmentPlans: InvestmentPlan[] }>(GET_ADMIN_INVESTMENT_PLANS)

    const [createPlan, { loading: creating }] = useMutation(ADMIN_CREATE_INVESTMENT_PLAN, {
        onCompleted: () => {
            toast.success('Investment plan created successfully!')
            resetForm()
            refetch()
        },
        onError: (err) => toast.error(err.message)
    })

    const [updatePlan, { loading: updating }] = useMutation(ADMIN_UPDATE_INVESTMENT_PLAN, {
        onCompleted: () => {
            toast.success('Investment plan updated successfully!')
            resetForm()
            refetch()
        },
        onError: (err) => toast.error(err.message)
    })

    const [togglePlan] = useMutation(ADMIN_TOGGLE_INVESTMENT_PLAN, {
        onCompleted: () => {
            toast.success('Plan status updated.')
            setActingId(null)
            refetch()
        },
        onError: (err) => {
            toast.error(err.message)
            setActingId(null)
        }
    })

    const [deletePlan] = useMutation(ADMIN_DELETE_INVESTMENT_PLAN, {
        onCompleted: () => {
            toast.success('Plan deleted successfully.')
            setActingId(null)
            refetch()
        },
        onError: (err) => {
            toast.error(err.message)
            setActingId(null)
        }
    })

    const resetForm = () => {
        setName('')
        setDurationMonths('')
        setRoiRate('')
        setMinAmount('500')
        setPlanType('standard')
        setEditingId(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const duration = parseInt(durationMonths)
        const roi = parseFloat(roiRate) / 100 // Convert e.g. 200% input -> 2.0
        const min = parseFloat(minAmount)

        if (isNaN(duration) || duration < 0) {
            toast.error('Duration must be a positive number')
            return
        }
        if (isNaN(roi) || roi < 0) {
            toast.error('ROI rate must be a positive number')
            return
        }
        if (isNaN(min) || min < 0) {
            toast.error('Minimum amount must be a positive number')
            return
        }

        if (editingId) {
            await updatePlan({
                variables: {
                    id: editingId,
                    name,
                    durationMonths: duration,
                    roiRate: roi,
                    minAmount: min,
                    planType
                }
            })
        } else {
            await createPlan({
                variables: {
                    name,
                    durationMonths: duration,
                    roiRate: roi,
                    minAmount: min,
                    planType
                }
            })
        }
    }

    const handleStartEdit = (p: InvestmentPlan) => {
        setEditingId(p.id)
        setName(p.name)
        setDurationMonths(p.durationMonths.toString())
        setRoiRate((p.roiRate * 100).toFixed(0))
        setMinAmount(p.minAmount.toString())
        setPlanType(p.planType)
    }

    const handleToggle = async (id: string) => {
        setActingId(id)
        await togglePlan({ variables: { id } })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) return
        setActingId(id)
        await deletePlan({ variables: { id } })
    }

    const plans = data?.adminInvestmentPlans || []

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-40 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-yellow-500" /> Loading investment plans...
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Shield className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Investment Plans</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage and configure active user investment plans</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to Create/Edit Plan */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 backdrop-blur-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                            <div className="flex items-center gap-2">
                                {editingId ? <Pencil className="h-5 w-5 text-yellow-500" /> : <Plus className="h-5 w-5 text-yellow-500" />}
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    {editingId ? 'Edit Plan' : 'Create Plan'}
                                </h2>
                            </div>
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    title="Cancel editing"
                                    className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Basic 1 Month Plan"
                                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Duration (Months)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={durationMonths}
                                        onChange={(e) => setDurationMonths(e.target.value)}
                                        placeholder="1"
                                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" /> ROI Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={roiRate}
                                        onChange={(e) => setRoiRate(e.target.value)}
                                        placeholder="200"
                                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5 text-zinc-400" /> Min Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        placeholder="500"
                                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Plan Type</label>
                                    <select
                                        value={planType}
                                        onChange={(e) => setPlanType(e.target.value as any)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:border-yellow-500 focus:outline-none"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="PIF">PIF</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={creating || updating}
                                    className="flex-2 flex-grow flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-all disabled:opacity-50"
                                >
                                    {(creating || updating) ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : editingId ? (
                                        <Pencil className="h-5 w-5" />
                                    ) : (
                                        <Plus className="h-5 w-5" />
                                    )}
                                    {editingId ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List of Plans */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Existing Plans ({plans.length})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-900">
                                    <tr>
                                        <th className="px-4 py-3">Plan Name</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3">ROI Rate</th>
                                        <th className="px-4 py-3">Min Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map((p) => {
                                        const isActing = actingId === p.id
                                        const isEditingThis = editingId === p.id
                                        return (
                                            <tr key={p.id} className={`border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/10 transition-colors ${isEditingThis ? 'bg-yellow-500/5 border-yellow-500/30' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-zinc-900 dark:text-white">{p.name}</div>
                                                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                        {p.planType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-zinc-900 dark:text-white">
                                                    {p.durationMonths} Month{p.durationMonths !== 1 ? 's' : ''}
                                                </td>
                                                <td className="px-4 py-4 text-green-500 font-bold">
                                                    {(p.roiRate * 100).toFixed(0)}%
                                                </td>
                                                <td className="px-4 py-4 text-zinc-900 dark:text-white font-mono">
                                                    ${p.minAmount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => handleToggle(p.id)}
                                                        disabled={isActing}
                                                        className="flex items-center gap-1 transition-colors"
                                                    >
                                                        {p.isActive ? (
                                                            <span className="flex items-center gap-1 text-green-500 text-xs font-semibold bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-zinc-500 text-xs font-semibold bg-zinc-500/10 border border-zinc-500/20 px-2.5 py-1 rounded-full">
                                                                <XCircle className="h-3 w-3" />
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleStartEdit(p)}
                                                            disabled={isActing}
                                                            title="Edit plan"
                                                            className="text-zinc-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggle(p.id)}
                                                            disabled={isActing}
                                                            title="Toggle plan status"
                                                            className="text-zinc-500 hover:text-yellow-500 transition-colors disabled:opacity-50"
                                                        >
                                                            {p.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            disabled={isActing}
                                                            title="Delete plan"
                                                            className="text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-50"
                                                        >
                                                            {isActing ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : <Trash2 size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {plans.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                                No investment plans found. Use the form to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
