'use client'

import { useState } from 'react'
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    Wallet,
    XCircle,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncWalletResult {
    address: string
    userId: string
    status: 'added' | 'already_registered' | 'failed'
    error?: string
}

interface SyncResponse {
    streamId?: string
    streamTag?: string
    totalWallets?: number
    added?: number
    alreadyRegistered?: number
    failed?: number
    results?: SyncWalletResult[]
    error?: string
}

interface RecoverResponse {
    success: boolean
    status?: 'confirmed' | 'pending'
    txHash?: string
    toAddress?: string
    userId?: string
    amount?: number
    confirmations?: number
    minConfirmations?: number
    wasAlreadyPending?: boolean
    alreadyProcessed?: boolean
    message?: string
    error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callAdminApi(path: string, body?: object) {
    const cronSecret = prompt(
        'Enter CRON_SECRET to authenticate this admin action:',
    )
    if (!cronSecret) throw new Error('Cancelled — no secret provided.')

    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cronSecret}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    const data = await res.json()
    if (!res.ok && !data) throw new Error(`HTTP ${res.status}`)
    return { ok: res.ok, data }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        added: 'bg-green-500/15 text-green-400 border-green-500/30',
        already_registered: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
        failed: 'bg-red-500/15 text-red-400 border-red-500/30',
        confirmed: 'bg-green-500/15 text-green-400 border-green-500/30',
        pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {status.replace(/_/g, ' ').toUpperCase()}
        </span>
    )
}

// ─── Section: Sync Wallets ────────────────────────────────────────────────────

function SyncWalletsPanel() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SyncResponse | null>(null)
    const [showDetails, setShowDetails] = useState(false)

    const handleSync = async () => {
        if (
            !confirm(
                'This will add ALL wallet addresses from the database to the Moralis stream. Continue?',
            )
        )
            return

        setLoading(true)
        setResult(null)
        try {
            const { data } = await callAdminApi('/api/admin/moralis/sync-wallets')
            setResult(data)
        } catch (err: any) {
            setResult({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const failed = result?.results?.filter((r) => r.status === 'failed') ?? []
    const added = result?.results?.filter((r) => r.status === 'added') ?? []
    const skipped = result?.results?.filter((r) => r.status === 'already_registered') ?? []

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                        <Wallet className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            Re-sync Wallets to Moralis Stream
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Registers every wallet address in the database with the{' '}
                            <code className="text-xs bg-zinc-800 px-1 py-0.5 rounded">usdt-deposits</code> Moralis stream.
                            Safe to run multiple times — addresses already registered are skipped.
                        </p>
                    </div>
                    <button
                        id="btn-sync-wallets"
                        onClick={handleSync}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        {loading ? 'Syncing…' : 'Run Sync'}
                    </button>
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="p-6 space-y-4">
                    {result.error ? (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{result.error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Wallets', value: result.totalWallets, color: 'text-zinc-300' },
                                    { label: 'Newly Added', value: result.added, color: 'text-green-400' },
                                    { label: 'Already Registered', value: result.alreadyRegistered, color: 'text-zinc-400' },
                                    { label: 'Failed', value: result.failed, color: result.failed ? 'text-red-400' : 'text-zinc-400' },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center"
                                    >
                                        <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Stream info */}
                            {result.streamId && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                    <Activity className="h-3.5 w-3.5" />
                                    Stream ID: <span className="text-zinc-300">{result.streamId}</span>
                                    &nbsp;·&nbsp; Tag: <span className="text-zinc-300">{result.streamTag}</span>
                                </div>
                            )}

                            {/* Failed addresses warning */}
                            {failed.length > 0 && (
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-red-400" />
                                        <span className="text-sm font-medium text-red-300">
                                            {failed.length} address{failed.length > 1 ? 'es' : ''} failed to register
                                        </span>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        {failed.map((f) => (
                                            <div key={f.address} className="flex items-start justify-between gap-4 text-xs font-mono">
                                                <span className="text-zinc-400 truncate">{f.address}</span>
                                                <span className="text-red-400 shrink-0">{f.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Toggle full details */}
                            {(result.results?.length ?? 0) > 0 && (
                                <div>
                                    <button
                                        onClick={() => setShowDetails((v) => !v)}
                                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                                    >
                                        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        {showDetails ? 'Hide' : 'Show'} full address list ({result.results?.length})
                                    </button>

                                    {showDetails && (
                                        <div className="mt-3 rounded-lg border border-zinc-800 overflow-hidden">
                                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="sticky top-0 bg-zinc-900 text-zinc-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2">Address</th>
                                                            <th className="px-4 py-2">User ID</th>
                                                            <th className="px-4 py-2">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.results?.map((r) => (
                                                            <tr
                                                                key={r.address}
                                                                className="border-t border-zinc-800/60 hover:bg-zinc-800/30"
                                                            >
                                                                <td className="px-4 py-2 font-mono text-zinc-300 truncate max-w-[180px]">
                                                                    {r.address}
                                                                </td>
                                                                <td className="px-4 py-2 font-mono text-zinc-500 truncate max-w-[120px]">
                                                                    {r.userId}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <StatusBadge status={r.status} />
                                                                    {r.error && (
                                                                        <span className="ml-2 text-red-400">{r.error}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Section: Recover Deposit ─────────────────────────────────────────────────

function RecoverDepositPanel() {
    const [txHash, setTxHash] = useState('')
    const [adminNotes, setAdminNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<RecoverResponse | null>(null)

    const handleRecover = async () => {
        const hash = txHash.trim()
        if (!hash || !hash.startsWith('0x')) {
            alert('Please enter a valid transaction hash starting with 0x')
            return
        }

        setLoading(true)
        setResult(null)
        try {
            const { data } = await callAdminApi('/api/admin/moralis/recover-deposit', {
                txHash: hash,
                adminNotes: adminNotes.trim() || undefined,
            })
            setResult(data)
        } catch (err: any) {
            setResult({ success: false, error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const isSuccess = result?.success
    const isAlreadyDone = result?.alreadyProcessed

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                        <Search className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            Recover Missed Deposit
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Paste an on-chain BSC transaction hash to manually look it up and
                            credit the user's wallet. Safe to re-run — the DB function is idempotent.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="tx-hash-input" className="block text-sm font-medium text-zinc-300">
                        Transaction Hash
                    </label>
                    <input
                        id="tx-hash-input"
                        type="text"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder="0xabc123..."
                        spellCheck={false}
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="admin-notes-input" className="block text-sm font-medium text-zinc-300">
                        Admin Notes <span className="text-zinc-600 font-normal">(optional)</span>
                    </label>
                    <input
                        id="admin-notes-input"
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="e.g. Customer support ticket #1234"
                        className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    />
                </div>

                <button
                    id="btn-recover-deposit"
                    onClick={handleRecover}
                    disabled={loading || !txHash.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ShieldAlert className="h-4 w-4" />
                    )}
                    {loading ? 'Processing…' : 'Recover Deposit'}
                </button>

                {/* Result */}
                {result && (
                    <div
                        className={`p-5 rounded-lg border space-y-4 ${
                            isAlreadyDone
                                ? 'bg-zinc-700/20 border-zinc-700'
                                : isSuccess
                                ? 'bg-green-500/10 border-green-500/25'
                                : 'bg-red-500/10 border-red-500/25'
                        }`}
                    >
                        {/* Status line */}
                        <div className="flex items-start gap-3">
                            {isAlreadyDone ? (
                                <CheckCircle2 className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
                            ) : isSuccess ? (
                                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <p className={`text-sm font-medium ${isAlreadyDone ? 'text-zinc-300' : isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                                {result.message || result.error || (isSuccess ? 'Processed successfully' : 'Recovery failed')}
                            </p>
                        </div>

                        {/* Detail grid */}
                        {(result.amount !== undefined || result.toAddress) && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
                                {result.amount !== undefined && (
                                    <>
                                        <span className="text-zinc-500">Amount</span>
                                        <span className="text-zinc-200">{result.amount?.toFixed(6)} USDT</span>
                                    </>
                                )}
                                {result.toAddress && (
                                    <>
                                        <span className="text-zinc-500">Wallet</span>
                                        <span className="text-zinc-200 truncate">{result.toAddress}</span>
                                    </>
                                )}
                                {result.userId && (
                                    <>
                                        <span className="text-zinc-500">User ID</span>
                                        <span className="text-zinc-200">{result.userId}</span>
                                    </>
                                )}
                                {result.confirmations !== undefined && (
                                    <>
                                        <span className="text-zinc-500">Confirmations</span>
                                        <span className={result.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}>
                                            {result.confirmations} / {result.minConfirmations}
                                        </span>
                                    </>
                                )}
                                {result.status && (
                                    <>
                                        <span className="text-zinc-500">Status</span>
                                        <StatusBadge status={result.status} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Pending warning */}
                        {result.success && result.status === 'pending' && (
                            <div className="flex items-center gap-2 text-xs text-yellow-400">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                Deposit is pending. Re-run this tool once enough blocks have passed, or wait for the cron to pick it up automatically.
                            </div>
                        )}

                        {/* BSCScan link */}
                        {result.txHash && (
                            <a
                                href={`https://bscscan.com/tx/${result.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View on BSCScan
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepositRecoveryPage() {
    return (
        <div className="space-y-8">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <ShieldAlert className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Deposit Recovery Tools
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Diagnose and fix missed deposits when the Moralis webhook didn't fire
                    </p>
                </div>
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-300/90 space-y-1">
                    <p className="font-medium">Admin-only tools</p>
                    <p className="text-amber-300/70">
                        These actions authenticate via your <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">CRON_SECRET</code>.
                        You will be prompted to enter it each time you click an action button.
                        All recovered deposits go through the same idempotent database function used by the Moralis webhook,
                        so they are safe to run more than once.
                    </p>
                </div>
            </div>

            {/* Quick diagnosis checklist */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-zinc-400" />
                    Before you start — quick diagnosis
                </h2>
                <ol className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400 list-decimal list-inside marker:text-zinc-600">
                    <li>
                        <strong className="text-zinc-300">Confirm the tx is on BSC.</strong>{' '}
                        Check{' '}
                        <a
                            href="https://bscscan.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                            bscscan.com <ExternalLink className="h-3 w-3" />
                        </a>{' '}
                        — the USDT contract must be <code className="bg-zinc-800 px-1 rounded text-xs">0x55d398...</code>
                    </li>
                    <li>
                        <strong className="text-zinc-300">Check the wallet is registered.</strong>{' '}
                        Open Moralis Dashboard → Streams → <code className="bg-zinc-800 px-1 rounded text-xs">usdt-deposits</code> → Addresses. If the customer's wallet is missing, run "Re-sync Wallets" below.
                    </li>
                    <li>
                        <strong className="text-zinc-300">Check webhook delivery.</strong>{' '}
                        In Moralis Dashboard → Streams → your stream → Failed Deliveries. A signature mismatch or 401 means the <code className="bg-zinc-800 px-1 rounded text-xs">MORALIS_WEBHOOK_SECRET</code> in Vercel doesn't match Moralis.
                    </li>
                    <li>
                        <strong className="text-zinc-300">For an immediate fix</strong>, use the "Recover Missed Deposit" panel with the customer's tx hash.
                    </li>
                </ol>
            </div>

            {/* Tool panels */}
            <SyncWalletsPanel />
            <RecoverDepositPanel />

            <div className="flex justify-start">
                <Link
                    href="/dashboard/admin/deposits"
                    className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    ← Back to Deposit History
                </Link>
            </div>
        </div>
    )
}
