'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Users, Copy, Check, TrendingUp, DollarSign, Award, Loader2, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { GET_MY_REFERRAL_STATS, GET_MY_REFERRALS, GET_MY_REFERRAL_EARNINGS } from '@/graphql/queries'

export default function ReferralsPage() {
    const [copied, setCopied] = useState(false)
    const [linkCopied, setLinkCopied] = useState(false)

    const { data: statsData, loading: statsLoading } = useQuery<any>(GET_MY_REFERRAL_STATS)
    const { data: referralsData, loading: referralsLoading } = useQuery<any>(GET_MY_REFERRALS)
    const { data: earningsData, loading: earningsLoading } = useQuery<any>(GET_MY_REFERRAL_EARNINGS)

    const stats = statsData?.myReferralStats
    const referrals = referralsData?.myReferrals || []
    const earnings = earningsData?.myReferralEarnings || []

    const handleCopyCode = () => {
        if (stats?.referralCode) {
            navigator.clipboard.writeText(stats.referralCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleCopyLink = () => {
        if (stats?.referralCode) {
            const link = `${window.location.origin}/login?ref=${stats.referralCode}`
            navigator.clipboard.writeText(link)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
        }
    }

    const bonusTiers = [
        { referrals: 5, bonus: 50, label: 'Bronze' },
        { referrals: 10, bonus: 100, label: 'Silver' },
        { referrals: 25, bonus: 250, label: 'Gold' },
        { referrals: 50, bonus: 500, label: 'Platinum' },
        { referrals: 100, bonus: 1000, label: 'Diamond' },
    ]

    const nextBonus = bonusTiers.find(tier => (stats?.totalReferrals || 0) < tier.referrals)
    const progress = nextBonus ? ((stats?.totalReferrals || 0) / nextBonus.referrals) * 100 : 100

    if (statsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Referral Program</h1>
                <p className="text-zinc-400">Earn 0.5% commission on every investment made by your referrals</p>
            </div>

            {/* Referral Code Card */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-yellow-500/20">
                            <Users className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Your Referral Code</h2>
                            <p className="text-sm text-zinc-400">Share this code to earn rewards</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 py-2 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <p className="text-[10px] font-medium text-zinc-500 mb-1">Referral Code</p>
                            <p className="text-[20px] font-mono font-bold text-yellow-500 tracking-wider">
                                {stats?.referralCode || 'Loading...'}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            title="Copy Code"
                            className="py-2 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition-all text-zinc-900 flex items-center gap-2 font-semibold self-stretch"
                        >
                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}

                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 py-2 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 truncate">
                            <p className="text-[10px] font-medium text-zinc-500 mb-1">Referral Link</p>
                            <p className="text-[20px] font-mono text-zinc-300 truncate">
                                {stats?.referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${stats.referralCode}` : 'Loading...'}
                            </p>
                        </div>
                        <button
                            onClick={handleCopyLink}
                            title="Copy Link"
                            className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all text-white flex items-center gap-2 font-semibold self-stretch border border-zinc-700"
                        >
                            {linkCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}

                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <p className="text-sm text-zinc-400">Total Referrals</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.totalReferrals || 0}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-zinc-400">Active Referrals</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.activeReferrals || 0}</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                        <p className="text-sm text-zinc-400">Total Earnings</p>
                    </div>
                    <p className="text-3xl font-bold text-white">${stats?.totalEarnings?.toFixed(2) || '0.00'}</p>
                </div>
            </div>

            {/* Bonus Progress */}
            {nextBonus && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-yellow-500" />
                            <div>
                                <h3 className="text-lg font-semibold text-white">Next Bonus: {nextBonus.label}</h3>
                                <p className="text-sm text-zinc-400">
                                    {stats?.totalReferrals || 0} / {nextBonus.referrals} referrals
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-500">${nextBonus.bonus}</p>
                            <p className="text-xs text-zinc-400">Bonus reward</p>
                        </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Referrals List */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Referrals</h2>
                {referralsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                    </div>
                ) : referrals.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No referrals yet</p>
                        <p className="text-sm text-zinc-500 mt-1">Share your referral code to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">User</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Joined</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {referrals.map((referral: any) => (
                                    <tr key={referral.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="text-white font-medium">{referral?.referee?.fullName}</p>
                                            <p className="text-xs text-zinc-500">{referral?.referee?.email}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(referral.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {referral.hasInvested ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span className="text-sm text-green-500">Active</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-4 w-4 text-zinc-500" />
                                                        <span className="text-sm text-zinc-500">Pending</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <p className="text-white font-semibold">${referral.totalEarnings?.toFixed(2) || '0.00'}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Earnings History */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Earnings History</h2>
                {earningsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                    </div>
                ) : earnings.length === 0 ? (
                    <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No earnings yet</p>
                        <p className="text-sm text-zinc-500 mt-1">You&apos;ll earn 0.5% commission when your referrals invest</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {earnings.map((earning: any) => (
                            <div
                                key={earning.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Commission from {earning.referredUser?.fullName}</p>
                                        <p className="text-sm text-zinc-400">
                                            Investment: ${earning.investmentAmount?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-500">+${earning.amount?.toFixed(2)}</p>
                                    <p className="text-xs text-zinc-500">
                                        {new Date(earning.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Withdrawal Info */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                        <h3 className="text-white font-semibold mb-1">Withdrawal Information</h3>
                        <p className="text-sm text-zinc-400">
                            Minimum withdrawal amount is $10. Your referral earnings are added to your available balance and can be withdrawn at any time once you reach the minimum threshold.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
