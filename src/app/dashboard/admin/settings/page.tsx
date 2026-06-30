'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_APP_SETTINGS, ADMIN_UPDATE_APP_WALLET } from '@/graphql/queries'
import { Settings, Wallet, Copy, Check, Save, AlertTriangle, ExternalLink, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
    const [editingWallet, setEditingWallet] = useState(false)
    const [newAddress, setNewAddress] = useState('')
    const [copied, setCopied] = useState(false)

    const { data, loading, refetch } = useQuery<{ appSettings: { companyWalletAddress: string } }>(GET_APP_SETTINGS)

    const companyWallet = data?.appSettings?.companyWalletAddress || ''

    useEffect(() => {
        if (companyWallet && !editingWallet) {
            setNewAddress(companyWallet)
        }
    }, [companyWallet, editingWallet])

    const [updateAppWallet, { loading: saving }] = useMutation(ADMIN_UPDATE_APP_WALLET, {
        onCompleted: (res) => {
            toast.success('Company wallet updated successfully.')
            setEditingWallet(false)
            refetch()
        },
        onError: (err) => {
            toast.error(err.message)
        }
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const evmRegex = /^0x[a-fA-F0-9]{40}$/
        if (!evmRegex.test(newAddress.trim())) {
            toast.error('Invalid BEP20 address. Must start with 0x and be 42 characters.')
            return
        }
        await updateAppWallet({ variables: { address: newAddress.trim() } })
    }

    const handleCopy = () => {
        if (companyWallet) {
            navigator.clipboard.writeText(companyWallet)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 border border-zinc-500/30 shrink-0">
                    <Settings className="h-6 w-6 text-zinc-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Platform Settings</h1>
                    <p className="text-sm text-zinc-500">Manage global app configuration</p>
                </div>
            </div>

            {/* Company Wallet Card */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Wallet className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Company Deposit Wallet</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">All users deposit USDT (BEP20) to this address</p>
                        </div>
                    </div>
                    {!editingWallet && (
                        <button
                            onClick={() => { setEditingWallet(true); setNewAddress(companyWallet) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center gap-2 text-zinc-500 py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : !editingWallet ? (
                        <div className="space-y-4">
                            {companyWallet ? (
                                <>
                                    <div>
                                        <label className="block text-xs text-zinc-500 uppercase tracking-wide mb-2">Current Address (BSC BEP20)</label>
                                        <div className="flex items-stretch gap-2">
                                            <div className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white break-all">
                                                {companyWallet}
                                            </div>
                                            <button
                                                onClick={handleCopy}
                                                className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all"
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
                                    <div className="flex gap-4">
                                        <a
                                            href={`https://bscscan.com/address/${companyWallet}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            View on BscScan
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-400">No wallet address set</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Users cannot see a deposit address until you configure one. Click <strong>Edit</strong> to set it.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Warning */}
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-400">
                                    Changing the wallet will immediately update the deposit address shown to <strong>all users</strong>. Make sure the new address is correct.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">New Company Wallet Address (BSC BEP20)</label>
                                <input
                                    type="text"
                                    value={newAddress}
                                    onChange={e => setNewAddress(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 font-mono text-sm transition-colors"
                                    placeholder="0x..."
                                    required
                                />
                                <p className="text-xs text-zinc-500 mt-1.5">Must be a valid BEP20 address (starts with 0x, 42 characters)</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setEditingWallet(false); setNewAddress(companyWallet) }}
                                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !newAddress.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="h-4 w-4" /> Save Wallet</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
