'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Loader2, TrendingUp, Info } from 'lucide-react'
import { format } from 'date-fns'
import { CREATE_INVESTMENT, GET_ME, GET_MY_INVESTMENTS, GET_MY_TRANSACTIONS, GET_DASHBOARD_DATA } from '@/graphql/queries'

export default function PIFPage() {
    const [amount, setAmount] = useState('5000')
    const [duration, setDuration] = useState<'1month' | '2weeks'>('1month')
    const [error, setError] = useState<boolean | string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const { data: userData } = useQuery<any>(GET_ME)
    const availableBalance = userData?.me?.availableBalance || 0

    const [createInvestment, { loading }] = useMutation(CREATE_INVESTMENT, {
        refetchQueries: [
            { query: GET_MY_INVESTMENTS },
            { query: GET_ME },
            { query: GET_MY_TRANSACTIONS, variables: { limit: 50 } },
            { query: GET_DASHBOARD_DATA }
        ],
        onCompleted: () => {
            setSuccess('PIF Investment created successfully!')
            setAmount('5000')
            setError(null)
        },
        onError: (err) => {
            setError(err.message)
            setSuccess(null)
        }
    })

    const roiRate = 4.0 // 400% for both plans

    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        const parsedAmount = parseFloat(amount)
        if (parsedAmount < 5000) {
            setError('Minimum investment for PIF is $5,000')
            return
        }

        try {
            const variables: any = {
                amount: parsedAmount,
                planType: 'PIF',
                roiRate: roiRate
            }

            if (duration === '1month') {
                variables.durationMonths = 1
            } else {
                variables.durationMonths = 0
                variables.durationHours = 336 // 14 days
            }

            await createInvestment({ variables })
        } catch (err: any) {
            // Error handled by onError callback
        }
    }

    // Calculations
    const parsedAmount = parseFloat(amount) || 0
    const fee = parsedAmount * 0.001 // 0.1%
    const totalDeduction = parsedAmount + fee
    const estimatedProfit = parsedAmount * roiRate
    const totalReturn = parsedAmount + estimatedProfit
    const maturityDate = new Date()
    if (duration === '1month') {
        maturityDate.setMonth(maturityDate.getMonth() + 1)
    } else {
        maturityDate.setDate(maturityDate.getDate() + 14)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <TrendingUp size={24} />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pooled Investment Fund (PIF)</h1>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex gap-3 text-sm">
                <Info className="shrink-0" size={20} />
                <p>The PIF is a high-yield short-term pool. Funds are locked for the chosen duration with a guaranteed ROI based on our current high-frequency strategy.</p>
            </div>

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
                            min="5000"
                            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="5000.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-zinc-500">Minimum: $5,000.00</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setDuration('1month')}
                            className={`p-4 rounded-lg border text-left transition-all ${duration === '1month' ? 'bg-yellow-500/10 border-yellow-500 ring-1 ring-yellow-500' : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}
                        >
                            <p className="text-xs text-zinc-500 uppercase font-bold">Duration</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">1 Month</p>
                            <p className="text-sm text-green-500 font-bold">400% ROI</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDuration('2weeks')}
                            className={`p-4 rounded-lg border text-left transition-all ${duration === '2weeks' ? 'bg-yellow-500/10 border-yellow-500 ring-1 ring-yellow-500' : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}
                        >
                            <p className="text-xs text-zinc-500 uppercase font-bold">Duration</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-white">2 Weeks</p>
                            <p className="text-sm text-green-500 font-bold">400% ROI</p>
                        </button>
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
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-zinc-900 hover:bg-yellow-400 disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm PIF Investment'}
                    </button>
                </form>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 text-sm text-zinc-600 dark:text-zinc-400">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">PIF Summary</h3>
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
                        <span>Guaranteed ROI ({(roiRate * 100).toFixed(0)}%):</span>
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

            <div className="text-xs text-zinc-500 text-center">
                PIF funds are locked for {duration === '1month' ? '1 month' : '2 weeks'}. Principle (full amount) + {(roiRate * 100).toFixed(0)}% Profit is returned upon maturity. High risk, high reward.
            </div>
        </div>
    )
}
