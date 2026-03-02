'use client'

import { useQuery } from '@apollo/client/react'
import { TrendingUp, Calendar, DollarSign, Loader2, Clock } from 'lucide-react'
import { GET_MY_INVESTMENTS } from '@/graphql/queries'

export default function InvestmentsPage() {
    const { data, loading } = useQuery<any>(GET_MY_INVESTMENTS)
    const investments = data?.myInvestments || []

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'completed':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            default:
                return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
        }
    }

    const calculateProgress = (startDate: string, endDate: string) => {
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        const now = Date.now()

        if (now >= end) return 100
        if (now <= start) return 0

        return Math.round(((now - start) / (end - start)) * 100)
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Active Investments</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Track your investment performance</p>
                </div>
            </div>

            {investments.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-12 text-center backdrop-blur-sm">
                    <TrendingUp className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">No investments yet</p>
                    <p className="text-sm text-zinc-500 mt-2">Start investing to see your portfolio here</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {investments.map((investment: any) => {
                        const progress = calculateProgress(investment.startDate, investment.endDate)

                        return (
                            <div
                                key={investment.id}
                                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-yellow-500/30 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all">
                                            <DollarSign className="h-5 w-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Investment Amount</p>
                                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                                ${investment.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(investment.status)}`}>
                                        {investment.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        <span className="text-zinc-600 dark:text-zinc-400">Duration:</span>
                                        <span className="text-zinc-900 dark:text-white font-medium">
                                            {investment.durationMonths === 0 ? '1 hour (Test)' : `${investment.durationMonths} months`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        <span className="text-zinc-600 dark:text-zinc-400">Started:</span>
                                        <span className="text-zinc-900 dark:text-white font-medium">
                                            {new Date(investment.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        <span className="text-zinc-600 dark:text-zinc-400">Ends:</span>
                                        <span className="text-zinc-900 dark:text-white font-medium">
                                            {new Date(investment.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {investment.status === 'active' && (
                                    <div>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
                                            <span className="text-yellow-500 font-medium">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-yellow-500 to-yellow-600 transition-all duration-500 rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
