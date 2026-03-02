'use client'

import { useQuery } from '@apollo/client/react'
import { ROIChart } from '@/components/ROIChart'
import { Wallet, TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { GET_DASHBOARD_DATA } from '@/graphql/queries'

export default function DashboardPage() {
    const { data, loading } = useQuery<any>(GET_DASHBOARD_DATA)

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-yellow-500" /></div>

    const user = data?.me || { balance: 0, availableBalance: 0 }
    const investments = (data?.myInvestments || []) as Array<{
        id: string
        amount: number
        status: string
        createdAt: string
        endDate: string
    }>
    const activeInvestments = investments.filter(inv => inv.status === 'active')
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0)
    const balance = user?.availableBalance || 0
    const roiData = (data?.myROI || []) as Array<{ profitAmount: number }>
    const totalProfit = roiData.reduce((sum, roi) => sum + roi.profitAmount, 0)
    const transactions = (data?.myTransactions || []) as Array<{
        id: string
        type: string
        amount: number
        createdAt: string
    }>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user?.fullName || 'User'}</h1>
                <p className="text-zinc-400">Here&apos;s your investment overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="group rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-yellow-500/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-zinc-400">Available Balance</p>
                        <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all">
                            <DollarSign className="h-5 w-5 text-yellow-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">${balance.toLocaleString()}</span>
                        <span className="text-sm text-zinc-500">USDT</span>
                    </div>
                </div>

                <div className="group rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-green-500/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-zinc-400">Total Profit</p>
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-all">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-500">${totalProfit.toLocaleString()}</span>
                        <span className="text-sm text-zinc-500">USDT</span>
                    </div>
                </div>

                <div className="group rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-zinc-400">Active Investment</p>
                        <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                            <Activity className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-500">${totalInvested.toLocaleString()}</span>
                        <span className="text-sm text-zinc-500">Locked</span>
                    </div>
                </div>

                <div className="group rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm hover:border-purple-500/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-zinc-400">Investments</p>
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
                            <Wallet className="h-5 w-5 text-purple-500" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-purple-500">{activeInvestments.length}</span>
                        <span className="text-sm text-zinc-500">Active</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ROI Chart */}
                <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 text-lg font-semibold text-white">Profit Performance</h2>
                    <div className="h-80">
                        <ROIChart data={roiData} />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                        <Link href="/dashboard/transactions" className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <p className="text-sm text-zinc-500 text-center py-8">No recent transactions</p>
                        ) : (
                            transactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-green-500/10' :
                                            tx.type === 'withdrawal' ? 'bg-red-500/10' :
                                                'bg-yellow-500/10'
                                            }`}>
                                            {tx.type === 'deposit' ? (
                                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                            ) : tx.type === 'withdrawal' ? (
                                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <TrendingUp className="h-4 w-4 text-yellow-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white capitalize">
                                                {tx.type.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-semibold ${tx.type === 'deposit' || tx.type === 'profit_payout' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {tx.type === 'withdrawal' || tx.type === 'investment_start' ? '-' : '+'}
                                        ${tx.amount.toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
