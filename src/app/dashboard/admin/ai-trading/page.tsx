'use client'

import React from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Loader2, ShieldCheck, ShieldAlert, TrendingUp, DollarSign, Users } from 'lucide-react'

// --- Types ---
interface AdminAiStats {
    totalRevenue: number
    totalPayouts: number
    netHouseProfit: number
    safetyStatus: 'SAFE' | 'AT RISK'
}

interface AdminInvestmentStats {
    totalActiveCapital: number
    totalProjectedPayout: number
    totalEstimatedProfit: number
    activeCount: number
}

interface AdminStatsData {
    adminAiStats: AdminAiStats
    adminInvestmentStats: AdminInvestmentStats
}

interface Investment {
    id: string
    amount: number
    startDate: string
    durationMonths: number
    profitPercent: number
    expectedProfit: number
    user: {
        email: string
        fullName: string
    }
}

interface InvestmentsData {
    adminInvestments: Investment[]
}

// --- Queries ---
const GET_ADMIN_STATS = gql`
  query GetAdminAiStats {
    adminAiStats {
      totalRevenue
      totalPayouts
      netHouseProfit
      safetyStatus
    }
    adminInvestmentStats {
      totalActiveCapital
      totalProjectedPayout
      totalEstimatedProfit
      activeCount
    }
  }
`

const GET_ADMIN_INVESTMENTS = gql`
    query GetAdminInvestments {
        adminInvestments {
            id
            amount
            startDate
            durationMonths
            user {
                email
                fullName
            }
        }
    }
`

const PROCESS_PAYOUTS = gql`
    mutation ProcessPayouts {
        processMatureInvestments
    }
`

export default function AdminAiTradingPage() {
    // Background Loading: We only show full loader if we have NO data.
    // Otherwise we show the stale data while refetching/polling.
    const { data, loading, error } = useQuery<AdminStatsData>(GET_ADMIN_STATS, {
        pollInterval: 5000,
        notifyOnNetworkStatusChange: true // Allows 'loading' to be true during refetch, but we can ignore it if we have data
    })

    // Initial Load Only
    if (loading && !data) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-yellow-500 w-8 h-8" /></div>
    if (error) return <div className="text-red-500 p-4">Error: {error.message}</div>

    // Safety: If data is missing for some reason (rare race condition), default to empty
    const adminAiStats = data?.adminAiStats || { totalRevenue: 0, totalPayouts: 0, netHouseProfit: 0, safetyStatus: 'SAFE' }
    const adminInvestmentStats = data?.adminInvestmentStats || { totalActiveCapital: 0, totalProjectedPayout: 0, totalEstimatedProfit: 0, activeCount: 0 }

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Admin Finance Dashboard</h1>
                    <p className="text-slate-400">Monitor AI Trading Profits and Investment Liabilities</p>
                </div>
                {/* Background Refresh Indicator */}
                {loading && data && (
                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Refreshing Live Data...
                    </div>
                )}
            </header>

            {/* AI Trading Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-yellow-500 w-6 h-6" />
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Trading (High Frequency)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Net Profit Card */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-16 h-16 text-green-500" />
                        </div>
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Net House Profit</div>
                        <div className={`text-3xl font-mono font-bold ${adminAiStats.netHouseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${adminAiStats.netHouseProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Total Revenue - Payouts</div>
                    </div>

                    {/* Revenue Card */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Staked (In)</div>
                        <div className="text-2xl font-mono text-zinc-900 dark:text-white">
                            ${adminAiStats.totalRevenue.toFixed(2)}
                        </div>
                    </div>

                    {/* Payouts Card */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Paid Out (Out)</div>
                        <div className="text-2xl font-mono text-red-300">
                            ${adminAiStats.totalPayouts.toFixed(2)}
                        </div>
                    </div>

                    {/* Safety Status Card */}
                    <div className={`p-6 border rounded-xl flex flex-col justify-center items-center ${adminAiStats.safetyStatus === 'SAFE' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        {adminAiStats.safetyStatus === 'SAFE' ? (
                            <ShieldCheck className="w-10 h-10 text-green-500 mb-2" />
                        ) : (
                            <ShieldAlert className="w-10 h-10 text-red-500 mb-2 animate-pulse" />
                        )}
                        <div className={`text-lg font-bold tracking-widest ${adminAiStats.safetyStatus === 'SAFE' ? 'text-green-500' : 'text-red-500'}`}>
                            POOL {adminAiStats.safetyStatus}
                        </div>
                        <div className="text-[10px] text-zinc-500 text-center mt-1">
                            {adminAiStats.safetyStatus === 'SAFE' ? 'Losses cover potential payouts' : 'WARNING: Payouts exceed losses'}
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />

            {/* Investment Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="text-blue-500 w-6 h-6" />
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Platform Investments (Long Term)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Active Capital */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Active Capital</div>
                        <div className="text-3xl font-mono text-blue-400">
                            ${adminInvestmentStats.totalActiveCapital.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">From {adminInvestmentStats.activeCount} active investments</div>
                    </div>

                    {/* Estimated Profit */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Estimated Profit</div>
                        <div className="text-3xl font-mono text-green-400">
                            +${adminInvestmentStats.totalEstimatedProfit?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Accumulated ROI to date</div>
                    </div>

                    {/* Projected Payout */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Obligations</div>
                        <div className="text-3xl font-mono text-zinc-900 dark:text-white">
                            ${adminInvestmentStats.totalProjectedPayout.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Capital + Estimated Profit</div>
                    </div>

                    {/* Controls */}
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col justify-center gap-3">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Actions</div>
                        <PayoutButton />
                    </div>
                </div>

                {/* Investment List - New */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Active Investments Breakdown</h3>
                    <InvestmentsTable />
                </div>
            </section>
        </div>
    )
}

// Sub-components
function PayoutButton() {
    const [processPayouts, { loading }] = useMutation(PROCESS_PAYOUTS, {
        refetchQueries: [GET_ADMIN_STATS, GET_ADMIN_INVESTMENTS]
    })

    const handlePayout = async () => {
        if (!confirm("Are you sure you want to process payouts for ALL mature investments? This will credit user balances.")) return;
        try {
            await processPayouts()
            alert("Payouts processed successfully")
        } catch (e: any) {
            alert(e.message)
        }
    }

    return (
        <button
            onClick={handlePayout}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-zinc-900 dark:text-white font-bold transition-all disabled:opacity-50"
        >
            {loading ? <Loader2 className="animate-spin" /> : <DollarSign className="w-5 h-5" />}
            Process Mature Payouts
        </button>
    )
}

function InvestmentsTable() {
    const { data, loading, error } = useQuery<InvestmentsData>(GET_ADMIN_INVESTMENTS, {
        pollInterval: 10000, // Poll every 10s
        notifyOnNetworkStatusChange: true
    })

    // Background Loading logic:
    // If we are loading AND have no data, show spinner block.
    // If we have data, we just show the table (maybe with subtle opacity change if strictness needed, but standard UX is to just show data)
    if (loading && !data) return <div className="text-zinc-500 animate-pulse">Loading investments...</div>
    if (error) return <div className="text-red-500">Error loading list: {error.message}</div>
    if (!data || !data.adminInvestments) return <div className="text-zinc-500">No active investments found.</div>

    return (
        <div className={`overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl relative transition-opacity duration-300 ${loading ? 'opacity-70' : 'opacity-100'}`}>
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 uppercase font-bold text-xs">
                    <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Capital</th>
                        <th className="p-4">Start Date</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Gain (7%/mo)</th>
                        <th className="p-4">Est. Payout</th>
                        <th className="p-4">Maturity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-white dark:bg-zinc-950/50">
                    {data.adminInvestments.map((inv) => {
                        const startDate = new Date(inv.startDate)
                        const maturityDate = new Date(startDate)
                        maturityDate.setMonth(startDate.getMonth() + inv.durationMonths)
                        const isMature = new Date() >= maturityDate

                        return (
                            <tr key={inv.id} className="hover:bg-zinc-50 dark:bg-zinc-900/50 transition-colors">
                                <td className="p-4">
                                    <div className="text-zinc-900 dark:text-white font-bold">{inv.user?.fullName || 'Unknown'}</div>
                                    <div className="text-xs">{inv.user?.email}</div>
                                </td>
                                <td className="p-4 font-mono text-zinc-900 dark:text-white">${inv.amount}</td>
                                <td className="p-4">{startDate.toLocaleDateString()}</td>
                                <td className="p-4">{inv.durationMonths} Months</td>
                                <td className="p-4 text-green-400 font-mono">+{(inv.durationMonths * 7).toFixed(2)}%</td>
                                <td className="p-4 text-green-400 font-mono">+${(inv.amount * (inv.durationMonths * 0.07)).toFixed(2)}</td>
                                <td className={`p-4 font-bold ${isMature ? 'text-yellow-500' : 'text-zinc-500'}`}>
                                    {maturityDate.toLocaleDateString()}
                                    {isMature && <span className="ml-2 text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20">MATURE</span>}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {/* Subtle loading indicator overlay if refreshing */}
            {loading && data && (
                <div className="absolute top-2 right-2">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                </div>
            )}
        </div>
    )
}
