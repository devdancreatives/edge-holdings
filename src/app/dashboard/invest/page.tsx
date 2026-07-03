'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import {
    CREATE_INVESTMENT,
    GET_ME,
    GET_MY_INVESTMENTS,
    GET_MY_TRANSACTIONS,
    GET_DASHBOARD_DATA,
    GET_INVESTMENT_PLANS
} from '@/graphql/queries'

export default function InvestPage() {
    const [amount, setAmount] = useState('')
    const [activeOption, setActiveOption] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const { data: userData } = useQuery<any>(GET_ME)
    const { data: plansData, loading: loadingPlans } = useQuery<any>(GET_INVESTMENT_PLANS)

    const availableBalance = userData?.me?.availableBalance || 0
    const plans = plansData?.investmentPlans || []

    useEffect(() => {
        if (plans.length > 0 && !activeOption) {
            setActiveOption(plans[0].id)
            setAmount(plans[0].minAmount.toString())
        }
    }, [plans, activeOption])

    const [createInvestment, { loading }] = useMutation(CREATE_INVESTMENT, {
        refetchQueries: [
            { query: GET_MY_INVESTMENTS },
            { query: GET_ME },
            { query: GET_MY_TRANSACTIONS, variables: { limit: 50 } },
            { query: GET_DASHBOARD_DATA }
        ],
        onCompleted: () => {
            setSuccess('Investment created successfully!')
            setError(null)
            // Reset to default min amount
            const currentPlan = plans.find((p: any) => p.id === activeOption)
            setAmount(currentPlan ? currentPlan.minAmount.toString() : '500')
        },
        onError: (err) => {
            setError(err.message)
            setSuccess(null)
        }
    })

    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            const variables: any = {
                amount: parseFloat(amount),
            }

            if (activeOption === '1h') {
                variables.durationMonths = 0
                variables.durationHours = 1
            } else {
                variables.planId = activeOption
            }

            await createInvestment({ variables })
        } catch (err: any) {
            // Error handled by onError callback
        }
    }

    const activePlan = plans.find((p: any) => p.id === activeOption)

    const parsedAmount = parseFloat(amount) || 0
    const fee = parsedAmount * 0.001 // 0.1%
    const totalDeduction = parsedAmount + fee

    let estimatedProfit = 0
    let maturityDate = new Date()
    let displayDuration = ''
    let roiText = ''
    let minAllowed = 500

    if (activeOption === '1h') {
        estimatedProfit = parsedAmount * 0.001 // 0.1% for test
        maturityDate.setHours(maturityDate.getHours() + 1)
        displayDuration = '1 hour'
        roiText = '0.1%'
        minAllowed = 500
    } else if (activePlan) {
        estimatedProfit = parsedAmount * activePlan.roiRate
        maturityDate.setMonth(maturityDate.getMonth() + activePlan.durationMonths)
        displayDuration = `${activePlan.durationMonths} month${activePlan.durationMonths !== 1 ? 's' : ''}`
        roiText = `${(activePlan.roiRate * 100).toFixed(0)}%`
        minAllowed = activePlan.minAmount
    }

    const totalReturn = parsedAmount + estimatedProfit

    if (loadingPlans) {
        return (
            <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">New Investment</h1>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 backdrop-blur-xl">
                <form onSubmit={handleInvest} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex justify-between">
                            <span>Investment Amount (USDT)</span>
                            <span className="text-xs text-yellow-500">Available: ${availableBalance.toFixed(2)}</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            min={minAllowed}
                            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder={minAllowed.toString()}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-zinc-500">Minimum required for this plan: ${minAllowed}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                            Select Plan
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {plans.map((p: any) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveOption(p.id)
                                        setAmount(p.minAmount.toString())
                                        setError(null)
                                        setSuccess(null)
                                    }}
                                    className={`flex flex-col items-center justify-center rounded-lg border px-3 py-3 text-sm font-medium transition-all ${activeOption === p.id
                                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                                        : 'border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-white hover:bg-zinc-100 hover:text-zinc-900'
                                        }`}
                                >
                                    <span className="text-base font-semibold">{p.name}</span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        {p.durationMonths} Month{p.durationMonths !== 1 ? 's' : ''} • {(p.roiRate * 100).toFixed(0)}% ROI
                                    </span>
                                    <span className="text-[10px] text-yellow-500/80 mt-0.5">Min: ${p.minAmount}</span>
                                </button>
                            ))}
                            {userData?.me?.role === 'admin' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveOption('1h')
                                        setAmount('500')
                                        setError(null)
                                        setSuccess(null)
                                    }}
                                    className={`flex flex-col items-center justify-center rounded-lg border px-3 py-3 text-sm font-medium transition-all ${activeOption === '1h'
                                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                                        : 'border-purple-900/30 bg-purple-900/10 text-purple-400 hover:bg-purple-900/20'
                                        }`}
                                >
                                    <span className="text-base font-semibold">1 Hour Test</span>
                                    <span className="text-xs text-zinc-500 mt-1">1 Hour • 0.1% ROI</span>
                                    <span className="text-[10px] text-purple-400 mt-0.5">Min: $500</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !activeOption}
                        className="flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-zinc-900 hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm Investment'}
                    </button>
                </form>
            </div>

            {activeOption && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Investment Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Capital Amount:</span>
                            <span className="text-zinc-900 dark:text-white">{parsedAmount > 0 ? `$${parsedAmount.toFixed(2)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>Service Fee (0.1% - from balance):</span>
                            <span>{parsedAmount > 0 ? `$${fee.toFixed(2)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between font-medium text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-2">
                            <span>Total Balance Deduction:</span>
                            <span className="text-yellow-500">{parsedAmount > 0 ? `$${totalDeduction.toFixed(2)}` : '-'}</span>
                        </div>

                        <div className="py-2"></div>

                        <div className="flex justify-between text-green-500">
                            <span>Est. ROI ({roiText}):</span>
                            <span>{parsedAmount > 0 ? `+$${estimatedProfit.toFixed(2)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>Maturity Date:</span>
                            <span>{parsedAmount > 0 ? format(maturityDate, 'MMMM do yyyy, h:mmaaaa') : '-'}</span>
                        </div>
                        <div className="flex justify-between font-bold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-2 mt-2">
                            <span>Est. Total Return:</span>
                            <span>{parsedAmount > 0 ? `$${totalReturn.toFixed(2)}` : '-'}</span>
                        </div>
                    </div>
                </div>
            )}

            {activeOption && (
                <div className="text-xs text-zinc-500 text-center">
                    Funds will be locked for {displayDuration}. Principal + Profit is returned upon maturity.
                </div>
            )}
        </div>
    )
}
