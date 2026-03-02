'use client'

import { useQuery } from '@apollo/client/react'
import { FileText, ArrowUpRight, ArrowDownLeft, TrendingUp, Loader2 } from 'lucide-react'
import { GET_MY_TRANSACTIONS } from '@/graphql/queries'

const getTransactionIcon = (type: string) => {
    switch (type) {
        case 'deposit':
            return <ArrowDownLeft className="h-5 w-5 text-green-500" />
        case 'withdrawal':
            return <ArrowUpRight className="h-5 w-5 text-red-500" />
        case 'profit_payout':
            return <TrendingUp className="h-5 w-5 text-yellow-500" />
        case 'investment_start':
            return <TrendingUp className="h-5 w-5 text-blue-500" />
        default:
            return <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
    }
}

const getTransactionColor = (type: string) => {
    switch (type) {
        case 'deposit':
            return 'text-green-500'
        case 'withdrawal':
            return 'text-red-500'
        case 'profit_payout':
            return 'text-yellow-500'
        case 'investment_start':
            return 'text-blue-500'
        default:
            return 'text-zinc-600 dark:text-zinc-400'
    }
}

export default function TransactionsPage() {
    const { data, loading } = useQuery<any>(GET_MY_TRANSACTIONS, {
        variables: { limit: 50 },
        fetchPolicy: 'network-only'
    })
    const transactions = data?.myTransactions || []

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
                    <FileText className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transactions</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">View your transaction history</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-600 dark:text-zinc-400">No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {transactions.map((tx: { id: string; type: string; amount: number; description?: string; createdAt: string }) => (
                            <div
                                key={tx.id}
                                className="p-4 hover:bg-zinc-100 dark:bg-zinc-800/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 group-hover:bg-zinc-100 dark:bg-zinc-800 transition-all">
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white capitalize">
                                                {tx.type.replace('_', ' ')}
                                            </p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {tx.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-semibold ${getTransactionColor(tx.type)}`}>
                                            {tx.type === 'withdrawal' || tx.type === 'investment_start' ? '-' : '+'}
                                            ${tx.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-500">USDT</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
