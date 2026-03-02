'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { CREATE_INVESTMENT, GET_ME, GET_MY_INVESTMENTS, GET_MY_TRANSACTIONS, GET_DASHBOARD_DATA } from '@/graphql/queries'

export default function InvestPage() {
    const [amount, setAmount] = useState('')
    const [duration, setDuration] = useState('1')
    const [error, setError] = useState<string | null>(null)
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
            setSuccess('Investment created successfully!')
            setAmount('')
            setError(null)
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
            await createInvestment({
                variables: {
                    amount: parseFloat(amount),
                    durationMonths: duration === '1h' ? 0 : parseInt(duration),
                    durationHours: duration === '1h' ? 1 : undefined
                }
            })
        } catch (err: any) {
            // Error handled by onError callback
        }
    }

    // Calculations for Summary
    const parsedAmount = parseFloat(amount) || 0
    const fee = parsedAmount * 0.001 // 0.1%
    const totalDeduction = parsedAmount + fee

    let estimatedProfit = 0
    let maturityDate = new Date()

    if (duration === '1h') {
        estimatedProfit = parsedAmount * 0.001 // 0.1% for test
        maturityDate.setHours(maturityDate.getHours() + 1)
    } else {
        const durationNum = parseInt(duration)
        estimatedProfit = parsedAmount * 0.07 * durationNum // 7% per month * duration
        maturityDate.setMonth(maturityDate.getMonth() + durationNum)
    }

    const totalReturn = parsedAmount + estimatedProfit

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
                            min="10"
                            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="1000.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Duration
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {[1, 2, 3, 6].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDuration(m.toString())}
                                    className={`flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${duration === m.toString()
                                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                                        : 'border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-white hover:bg-zinc-100 hover:text-zinc-900'
                                        }`}
                                >
                                    <span className="text-lg">{m}</span>
                                    <span className="text-xs">Month{m > 1 ? 's' : ''}</span>
                                </button>
                            ))}
                            {userData?.me?.role === 'admin' && (
                                <button
                                    type="button"
                                    onClick={() => setDuration('1h')}
                                    className={`flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${duration === '1h'
                                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                                        : 'border-purple-900/30 bg-purple-900/10 text-purple-400 hover:bg-purple-900/20'
                                        }`}
                                >
                                    <span className="text-lg">1</span>
                                    <span className="text-xs">Hour (Test)</span>
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
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-zinc-900 hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm Investment'}
                    </button>
                </form>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 text-sm text-zinc-600 dark:text-zinc-400">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Investment Summary</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Capital Amount:</span>
                        <span className="text-zinc-900 dark:text-white">{parsedAmount > 0 ? `$${parsedAmount.toFixed(2)}` : '-'}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>Service Fee (0.1%):</span>
                        <span>{parsedAmount > 0 ? `$${fee.toFixed(2)}` : '-'}</span>
                    </div>
                    <div className="flex justify-between font-medium text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-2">
                        <span>Total Deduction:</span>
                        <span className="text-yellow-500">{parsedAmount > 0 ? `$${totalDeduction.toFixed(2)}` : '-'}</span>
                    </div>

                    <div className="py-2"></div>

                    <div className="flex justify-between text-green-500">
                        <span>Est. ROI ({duration === '1h' ? '0.1%' : '7%'}):</span>
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
                Funds will be locked for {duration === '1h' ? '1 hour' : `${duration} months`}. Principal + Profit is returned upon maturity.
            </div>
        </div >
    )
}
