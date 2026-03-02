'use client'

import { useQuery } from '@apollo/client/react'
import { Clock, CheckCircle, XCircle, Loader2, ExternalLink, TrendingDown } from 'lucide-react'
import { GET_MY_DEPOSITS } from '@/graphql/queries'

export default function DepositsPage() {
    const { data, loading } = useQuery<any>(GET_MY_DEPOSITS)
    const deposits = data?.myDeposits || []

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-500" />
            default:
                return <Clock className="h-5 w-5 text-zinc-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'text-green-500 bg-green-500/10 border-green-500/20'
            case 'pending':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            case 'failed':
                return 'text-red-500 bg-red-500/10 border-red-500/20'
            default:
                return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
                    <TrendingDown className="h-6 w-6 text-green-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Deposit History</h1>
                    <p className="text-sm text-zinc-400">Track your USDT deposits and their status</p>
                </div>
            </div>

            {deposits.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-12 text-center backdrop-blur-sm">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-zinc-800/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <TrendingDown className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No Deposits Yet</h2>
                        <p className="text-zinc-400">
                            Your deposit history will appear here once you make your first deposit
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {deposits.map((deposit: any) => (
                        <div
                            key={deposit.id}
                            className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-zinc-700 transition-all"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-zinc-800/50">
                                        {getStatusIcon(deposit.status)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-white">
                                                ${deposit.amount.toLocaleString()} USDT
                                            </h3>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                                                    deposit.status
                                                )}`}
                                            >
                                                {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 mb-2">
                                            {new Date(deposit.createdAt).toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-zinc-500 font-mono break-all sm:break-normal">
                                                <span className="hidden sm:inline">{deposit.txHash}</span>
                                                <span className="sm:hidden">
                                                    {deposit.txHash.slice(0, 10)}...{deposit.txHash.slice(-10)}
                                                </span>
                                            </p>
                                            <a
                                                href={`https://tronscan.org/#/transaction/${deposit.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-500 hover:text-yellow-400 transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                {deposit.confirmedAt && (
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500">Confirmed</p>
                                        <p className="text-sm text-zinc-400">
                                            {new Date(deposit.confirmedAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
