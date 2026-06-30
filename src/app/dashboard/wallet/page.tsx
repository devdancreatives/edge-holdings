'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import {
    Wallet as WalletIcon, Copy, Check, Plus, Loader2, ExternalLink,
    Clock, CheckCircle2, XCircle, AlertCircle, Upload, QrCode
} from 'lucide-react'
import {
    GET_ME,
    CREATE_MY_WALLET,
    REQUEST_WITHDRAWAL,
    GET_MY_WITHDRAWALS,
    GET_MY_DEPOSITS,
    GET_APP_SETTINGS,
    SUBMIT_DEPOSIT_REQUEST
} from '@/graphql/queries'
import { toast } from 'sonner'

type Deposit = {
    id: string
    amount: number
    txHash: string
    status: 'pending' | 'confirmed' | 'declined'
    declineReason?: string | null
    createdAt: string
    confirmedAt?: string | null
}

const statusConfig = {
    pending: {
        label: 'Pending Review',
        icon: Clock,
        cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
    confirmed: {
        label: 'Confirmed',
        icon: CheckCircle2,
        cls: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    declined: {
        label: 'Declined',
        icon: XCircle,
        cls: 'bg-red-500/10 text-red-500 border-red-500/20',
    },
}

export default function WalletPage() {
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [txHash, setTxHash] = useState('')
    const [depositAmount, setDepositAmount] = useState('')
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawAddress, setWithdrawAddress] = useState('')
    const [withdrawError, setWithdrawError] = useState('')

    const { data: meData, loading: meLoading } = useQuery<any>(GET_ME)
    const { data: depositsData, refetch: refetchDeposits } = useQuery<{ myDeposits: Deposit[] }>(GET_MY_DEPOSITS)
    const { data: withdrawalData } = useQuery<any>(GET_MY_WITHDRAWALS)
    const { data: settingsData } = useQuery<{ appSettings: { companyWalletAddress: string } }>(GET_APP_SETTINGS)

    const companyWallet = settingsData?.appSettings?.companyWalletAddress || ''

    const [createWallet] = useMutation(CREATE_MY_WALLET, {
        refetchQueries: [{ query: GET_ME }],
        onCompleted: () => setCreating(false),
        onError: (err) => {
            setCreating(false)
            toast.error('Could not activate wallet: ' + err.message)
        }
    })

    const [submitDepositRequest, { loading: submitting }] = useMutation(SUBMIT_DEPOSIT_REQUEST, {
        onCompleted: () => {
            toast.success('Deposit request submitted! The support team will review it shortly.')
            setTxHash('')
            setDepositAmount('')
            setShowDepositModal(false)
            refetchDeposits()
        },
        onError: (err) => toast.error(err.message)
    })

    const [requestWithdrawal, { loading: withdrawing }] = useMutation(REQUEST_WITHDRAWAL, {
        refetchQueries: [{ query: GET_ME }, { query: GET_MY_WITHDRAWALS }],
        onCompleted: () => {
            setShowWithdrawModal(false)
            setWithdrawAmount('')
            setWithdrawAddress('')
        },
        onError: (err) => setWithdrawError(err.message)
    })

    const wallet = meData?.me?.wallet

    const handleCopy = () => {
        if (companyWallet) {
            navigator.clipboard.writeText(companyWallet)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSubmitDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(depositAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Enter a valid amount')
            return
        }
        if (!txHash.trim()) {
            toast.error('Transaction hash is required')
            return
        }
        await submitDepositRequest({ variables: { txHash: txHash.trim(), amount } })
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
        await requestWithdrawal({ variables: { amount, walletAddress: withdrawAddress } })
    }

    const FEE = 3.00
    const deposits = depositsData?.myDeposits || []
    const pendingDeposits = deposits.filter(d => d.status === 'pending')

    if (meLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 shrink-0">
                        <WalletIcon className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Wallet</h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your USDT deposits &amp; withdrawals</p>
                    </div>
                </div>
                {wallet && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors text-sm"
                        >
                            <Upload className="h-4 w-4 shrink-0" />
                            I&apos;ve Made a Deposit
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors border border-zinc-200 dark:border-zinc-700 text-sm"
                        >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                            Withdraw
                        </button>
                    </div>
                )}
            </div>

            {/* Balance Card */}
            {wallet && (
                <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-500/80 mb-1">Available Funds</p>
                        <h2 className="text-3xl font-bold text-yellow-500">
                            ${meData?.me?.availableBalance?.toFixed(2) || '0.00'}
                        </h2>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <WalletIcon className="h-6 w-6 text-yellow-500" />
                    </div>
                </div>
            )}

            {/* Pending notice */}
            {pendingDeposits.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                    <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-yellow-500">
                            {pendingDeposits.length} deposit{pendingDeposits.length > 1 ? 's' : ''} pending review
                        </p>
                        <p className="text-xs text-yellow-500/80 mt-0.5">
                            The support team will verify and credit your account once approved.
                        </p>
                    </div>
                </div>
            )}

            {/* No wallet state */}
            {!wallet ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center backdrop-blur-sm">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <WalletIcon className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Activate Your Wallet</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            Activate your wallet to get the deposit address and start making investments.
                        </p>
                        <button
                            onClick={async () => { setCreating(true); await createWallet() }}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50"
                        >
                            {creating ? (
                                <><Loader2 className="h-5 w-5 animate-spin" />Activating...</>
                            ) : (
                                <><Plus className="h-5 w-5" />Activate Wallet</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Deposit Address Card */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <QrCode className="h-5 w-5 text-yellow-500" />
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Deposit Address</h2>
                        </div>

                        {companyWallet ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                        Send USDT (BEP20) to this address
                                    </label>
                                    <div className="flex flex-row items-stretch gap-2">
                                        <div className="flex-1 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white overflow-hidden">
                                            <span className="hidden sm:inline break-all">{companyWallet}</span>
                                            <span className="sm:hidden">
                                                {companyWallet.slice(0, 10)}...{companyWallet.slice(-10)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all"
                                            title="Copy address"
                                        >
                                            {copied ? (
                                                <Check className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Copy className="h-5 w-5 text-zinc-500" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Network</p>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">BSC (BEP20)</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Token</p>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">USDT</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        After sending, click <strong className="text-yellow-500">I&apos;ve Made a Deposit</strong> and paste your transaction hash. The support team will verify and credit your account.
                                    </p>
                                </div>

                                <a
                                    href={`https://bscscan.com/address/${companyWallet}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    View on BscScan
                                </a>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-zinc-500 text-sm">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                                Deposit address not yet configured. Please contact support.
                            </div>
                        )}
                    </div>

                    {/* Deposit History */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Deposit History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">TX Hash</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deposits.map((d) => {
                                        const cfg = statusConfig[d.status] || statusConfig.pending
                                        const Icon = cfg.icon
                                        return (
                                            <tr key={d.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                                <td className="px-6 py-4 text-zinc-500 text-xs">
                                                    {new Date(d.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">
                                                    {d.amount.toFixed(2)} USDT
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                                    <span className="mr-1">{d.txHash.slice(0, 8)}...{d.txHash.slice(-6)}</span>
                                                    <a
                                                        href={`https://bscscan.com/tx/${d.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-400"
                                                    >
                                                        <ExternalLink size={11} className="inline" />
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
                                                            <Icon className="h-3 w-3" />
                                                            {cfg.label}
                                                        </span>
                                                        {d.status === 'declined' && d.declineReason && (
                                                            <p className="mt-1 text-xs text-red-400">
                                                                Reason: {d.declineReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {deposits.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                                No deposits yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Withdrawal History */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Withdrawal History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50">
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
                                        <tr key={w.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="px-6 py-4 text-zinc-500 text-xs">
                                                {new Date(w.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                                {w.amount.toFixed(2)} USDT
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500">
                                                {w.fee ? w.fee.toFixed(2) : '0.00'} USDT
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                    w.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                                {w.walletAddress.slice(0, 6)}...{w.walletAddress.slice(-6)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!withdrawalData?.myWithdrawals || withdrawalData.myWithdrawals.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                No withdrawal history
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20 p-6">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">⚠️ Important Information</h3>
                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Deposits:</strong> Only send USDT on BSC (BEP20). Other networks may result in permanent loss.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>After sending:</strong> Submit your transaction hash to notify the support team for approval.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Withdrawals:</strong> Minimum 10 USDT. A $3.00 fee applies to all withdrawals.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Deposit Request Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Confirm Deposit</h3>
                        <p className="text-sm text-zinc-500 mb-5">Paste your transaction hash and amount. The support team will verify and approve your deposit.</p>
                        <form onSubmit={handleSubmitDeposit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Transaction Hash (TX ID)</label>
                                <input
                                    type="text"
                                    value={txHash}
                                    onChange={e => setTxHash(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 font-mono text-sm transition-colors"
                                    placeholder="0x..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Amount (USDT)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={depositAmount}
                                    onChange={e => setDepositAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Withdraw Funds</h3>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Amount (USDT)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={withdrawAmount}
                                    onChange={e => setWithdrawAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                    placeholder="Min 10.00"
                                    required
                                />
                                {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                                    <div className="mt-2 text-xs flex justify-between text-zinc-500">
                                        <span>Fee: ${FEE.toFixed(2)}</span>
                                        <span>Total deduction: ${(parseFloat(withdrawAmount) + FEE).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Destination Address (BEP20)</label>
                                <input
                                    type="text"
                                    value={withdrawAddress}
                                    onChange={e => setWithdrawAddress(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 font-mono transition-colors"
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
                                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={withdrawing}
                                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold transition-colors disabled:opacity-50"
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
