'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Wallet as WalletIcon, Copy, Check, Plus, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { GET_ME, CREATE_MY_WALLET, REQUEST_WITHDRAWAL, GET_MY_WITHDRAWALS, SYNC_MY_DEPOSITS } from '@/graphql/queries'
import { toast } from 'sonner'

export default function WalletPage() {
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [syncing, setSyncing] = useState(false)

    // Use Apollo hooks instead of fetch
    const { data, loading } = useQuery<any>(GET_ME)

    const [syncDeposits] = useMutation(SYNC_MY_DEPOSITS, {
        refetchQueries: [{ query: GET_ME }],
        onCompleted: (data) => {
            setSyncing(false)
            const count = data?.syncMyDeposits || 0
            if (count > 0) {
                toast.success(`Found and credited ${count} new deposit(s)!`)
            } else {
                toast.info('No new deposits found. If you just sent it, please wait a few minutes for blockchain confirmations.')
            }
        },
        onError: (error) => {
            console.error('Sync error:', error)
            setSyncing(false)
            toast.error('Failed to sync: ' + error.message)
        }
    })

    const handleSync = async () => {
        setSyncing(true)
        await syncDeposits()
    }

    const [createWallet] = useMutation(CREATE_MY_WALLET, {
        refetchQueries: [{ query: GET_ME }],
        onCompleted: () => {
            setCreating(false)
        },
        onError: (error) => {
            console.error('Error creating wallet:', error)
            setCreating(false)
        }
    })

    const wallet = data?.me?.wallet

    const handleCreateWallet = async () => {
        setCreating(true)
        try {
            await createWallet()
        } catch (error) {
            console.error('Failed to create wallet:', error)
            setCreating(false)
        }
    }

    const handleCopy = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawAddress, setWithdrawAddress] = useState('')
    const [withdrawError, setWithdrawError] = useState('')

    const { data: withdrawalData } = useQuery<any>(GET_MY_WITHDRAWALS)
    const [requestWithdrawal, { loading: withdrawing }] = useMutation(REQUEST_WITHDRAWAL, {
        refetchQueries: [{ query: GET_ME }, { query: GET_MY_WITHDRAWALS }],
        onCompleted: () => {
            setShowWithdrawModal(false)
            setWithdrawAmount('')
            setWithdrawAddress('')
            setWithdrawError('')
        },
        onError: (error) => {
            setWithdrawError(error.message)
        }
    })

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        setWithdrawError('')

        const amount = parseFloat(withdrawAmount)
        if (isNaN(amount) || amount < 10) {
            setWithdrawError('Minimum withdrawal is 10 USDT')
            return
        }

        const evmRegex = /^0x[a-fA-F0-9]{40}$/
        if (!evmRegex.test(withdrawAddress)) {
            setWithdrawError("Invalid BSC address. Must start with '0x' and be 42 chars.")
            return
        }

        await requestWithdrawal({
            variables: {
                amount: amount,
                walletAddress: withdrawAddress
            }
        })
    }

    const FEE = 3.00

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                        <WalletIcon className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Wallet</h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your USDT deposits & withdrawals</p>
                    </div>
                </div>
                {wallet && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-medium transition-colors border border-yellow-500/30 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Checking...' : 'Check for Deposits'}
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors border border-zinc-700"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Withdraw
                        </button>
                    </div>
                )}
            </div>

            {/* Balance Card */}
            {wallet && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-500/80 mb-1">Available Funds</p>
                        <h2 className="text-3xl font-bold text-yellow-500">${data?.me?.availableBalance?.toFixed(2) || '0.00'}</h2>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <WalletIcon className="h-6 w-6 text-yellow-500" />
                    </div>
                </div>
            )}

            {!wallet ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <WalletIcon className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No Wallet Yet</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            Create a wallet to start depositing USDT and making investments
                        </p>
                        <button
                            onClick={handleCreateWallet}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating Wallet...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    Create Wallet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Wallet Address</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">BSC (BEP20) Address</label>
                                <div className="flex flex-row items-stretch sm:items-center gap-2">
                                    <div className="flex-1 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white overflow-hidden">
                                        <span className="hidden sm:inline break-all">{wallet.address}</span>
                                        <span className="sm:hidden">
                                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-100 dark:bg-zinc-800 transition-all"
                                        title="Copy address"
                                    >
                                        {copied ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Copy className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-700">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Network</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">BSC (BEP20)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Token Symbol</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">USDT</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>Derivation Path Index:</span>
                                <span className="text-zinc-900 dark:text-white font-mono">{wallet.pathIndex}</span>
                            </div>
                        </div>
                    </div>

                    {/* Withdrawal History */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Withdrawal History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Fee</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalData?.myWithdrawals?.map((w: any) => (
                                        <tr key={w.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800/30">
                                            <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                                {new Date(w.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">
                                                {w.amount.toFixed(2)} USDT
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {w.fee ? w.fee.toFixed(2) : '0.00'} USDT
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${w.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                                {w.walletAddress.slice(0, 6)}...{w.walletAddress.slice(-6)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!withdrawalData?.myWithdrawals || withdrawalData.myWithdrawals.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                No withdrawal history found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-linear-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">⚠️ Important Information</h3>
                        <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Withdrawals:</strong> Minimum 10 USDT. A $3.00 fee applies to all withdrawals.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Network:</strong> BSC (BEP20) only - verify your destination address carefully.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">View on Blockchain</h3>
                        <a
                            href={`https://bscscan.com/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on BscScan
                        </a>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-xl p-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Withdraw Funds</h3>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Amount (USDT)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500 transition-colors"
                                    placeholder="Min 10.00"
                                    required
                                />
                                {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                                    <div className="mt-2 text-xs flex justify-between text-zinc-600 dark:text-zinc-400">
                                        <span>Fee: ${FEE.toFixed(2)}</span>
                                        <span>Total Deduction: ${(parseFloat(withdrawAmount) + FEE).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Destination Address (BEP20)</label>
                                <input
                                    type="text"
                                    value={withdrawAddress}
                                    onChange={(e) => setWithdrawAddress(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500 transition-colors font-mono"
                                    placeholder="0x..."
                                    required
                                />
                            </div>

                            {withdrawError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {withdrawError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={withdrawing}
                                    className="flex-1 px-4 py-3 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold transition-colors disabled:opacity-50"
                                >
                                    {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
