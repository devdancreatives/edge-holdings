'use client'

import { useState } from 'react'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react'
import { GET_ADMIN_USERS, ADMIN_UPDATE_USER, GET_ADMIN_USERS_KEYS, ADMIN_DELETE_USER } from '@/graphql/queries'
import { Edit2, X, Save, Eye, EyeOff, ExternalLink, Lock, Trash2, ShieldCheck, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

interface AdminUsersKeysData {
    adminUsers: {
        id: string
        wallet: {
            privateKey: string
        } | null
    }[]
}

export default function AdminUsersPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_USERS)
    const [updateUser] = useMutation(ADMIN_UPDATE_USER)
    const [deleteUser] = useMutation(ADMIN_DELETE_USER)

    const [editingUser, setEditingUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        balance: '',
        profitAdjustment: '',
        transactionTitle: '',
        transactionDescription: ''
    })
    const [visibleKeys, setVisibleKeys] = useState<Record<string, string>>({}) // Map userId -> privateKey
    const [verificationModal, setVerificationModal] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null })
    const [password, setPassword] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
  
    const [getKeys] = useLazyQuery<AdminUsersKeysData>(GET_ADMIN_USERS_KEYS)
    const [isSaving, setIsSaving] = useState(false)

    const handleEdit = (user: any) => {
        setEditingUser(user)
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || 'user',
            balance: user.availableBalance?.toString() || '0',
            profitAdjustment: '',
            transactionTitle: '',
            transactionDescription: ''
        })
    }

    const handleSave = async () => {
        if (!editingUser) return

        const newBalance = parseFloat(formData.balance)
        const currentBalance = editingUser.availableBalance ?? 0
        const balanceChanged = newBalance !== currentBalance

        const profitAdj = parseFloat(formData.profitAdjustment)
        const profitChanged = !isNaN(profitAdj) && profitAdj !== 0

        if ((balanceChanged || profitChanged) && !formData.transactionTitle.trim()) {
            toast.error('Please enter a transaction title for the ledger adjustment')
            return
        }

        setIsSaving(true)
        try {
            await updateUser({
                variables: {
                    id: editingUser.id,
                    input: {
                        fullName: formData.fullName,
                        email: formData.email,
                        role: formData.role,
                        balance: newBalance,
                        ...(profitChanged ? { profitAdjustment: profitAdj } : {}),
                        ...((balanceChanged || profitChanged) ? {
                            transactionTitle: formData.transactionTitle.trim(),
                            transactionDescription: formData.transactionDescription.trim() || undefined
                        } : {})
                    }
                }
            })
            await refetch()
            setEditingUser(null)
            toast.success('User updated successfully')
        } catch (e) {
            console.error(e)
            toast.error('Failed to update user')
        } finally {
            setIsSaving(false)
        }
    }
  
    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to permanently delete user ${email}? This action cannot be undone and will remove all their financial history.`)) {
            return
        }

        try {
            await deleteUser({
                variables: { id: userId }
            })
            await refetch()
            toast.success('User deleted successfully')
        } catch (e) {
            console.error(e)
            toast.error('Failed to delete user')
        }
    }

    const handleViewKey = (userId: string) => {
        if (visibleKeys[userId]) {
            // Toggle off
            const newKeys = { ...visibleKeys }
            delete newKeys[userId]
            setVisibleKeys(newKeys)
        } else {
            // Open modal to verify
            setVerificationModal({ isOpen: true, userId })
            setPassword('')
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!verificationModal.userId || !password) return

        setIsVerifying(true)
        try {
            // Use a temporary client to verify password without affecting global session/Apollo Client
            const tempClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error('No admin user found')

            const { error } = await tempClient.auth.signInWithPassword({
                email: user.email,
                password
            })

            if (error) {
                toast.error('Invalid password')
                return
            }

            // Success - fetch keys
            const { data: keysData } = await getKeys()
            const userKey = keysData?.adminUsers?.find(u => u.id === verificationModal.userId)?.wallet?.privateKey

            if (userKey) {
                setVisibleKeys(prev => ({ ...prev, [verificationModal.userId!]: userKey }))
                setVerificationModal({ isOpen: false, userId: null })
                toast.success('Private key unlocked')
            } else {
                toast.error('Could not retrieve key')
            }

        } catch (err: any) {
            console.error('Verification Error:', err)
            toast.error(`Verification failed: ${err.message}`)
        } finally {
            setIsVerifying(false)
        }
    }

    if (loading && !data) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Loading users...</div>

    const users = data?.adminUsers || []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <ShieldCheck className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">User Management</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Manage user credentials, balances, wallets, and profit updates</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Total Profit</th>
                                <th className="px-6 py-4">Wallet</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id} className="border-b border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/10 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                        {u.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-medium">
                                        {u.fullName}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {u.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-mono">
                                        ${(u.availableBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-green-500 font-bold font-mono">
                                        ${(u.totalProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {u.wallet ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-600 dark:text-zinc-400">
                                                        {u.wallet.address.slice(0, 6)}...{u.wallet.address.slice(-4)}
                                                    </span>
                                                    <a
                                                        href={`https://bscscan.com/address/${u.wallet.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-400"
                                                        title="View on BscScan"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-zinc-600 font-mono">
                                                        {visibleKeys[u.id] ? visibleKeys[u.id] : '••••••••••••••••••••••••••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleViewKey(u.id)}
                                                        className="text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors cursor-pointer"
                                                        title={visibleKeys[u.id] ? "Hide Private Key" : "Show Private Key"}
                                                    >
                                                        {visibleKeys[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">No Wallet</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors cursor-pointer"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Verification Modal */}
            {verificationModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Lock size={18} className="text-yellow-500" />
                                Verify Identity
                            </h3>
                            <button
                                onClick={() => setVerificationModal({ isOpen: false, userId: null })}
                                className="text-zinc-500 hover:text-zinc-900 dark:text-white cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Please enter your admin password to view this private key.
                        </p>
                        <form onSubmit={handleVerify} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Admin Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setVerificationModal({ isOpen: false, userId: null })}
                                    className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-zinc-900 dark:text-white text-sm font-medium disabled:opacity-50 cursor-pointer"
                                >
                                    {isVerifying ? 'Verifying...' : 'Unlock Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh]">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500 font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Add to Profit (USDT)</label>
                                    <span className="text-[10px] text-zinc-400">
                                        Current: <span className="font-semibold text-green-500">${(editingUser.totalProfit ?? 0).toFixed(2)}</span>
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 100.00 or -50.00"
                                    value={formData.profitAdjustment}
                                    onChange={(e) => setFormData({ ...formData, profitAdjustment: e.target.value })}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500 font-mono"
                                />
                            </div>
                            {(parseFloat(formData.balance) !== (editingUser.availableBalance ?? 0) || (formData.profitAdjustment && parseFloat(formData.profitAdjustment) !== 0)) && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                            Transaction Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Bonus Payment, Profit Dividend"
                                            value={formData.transactionTitle}
                                            onChange={(e) => setFormData({ ...formData, transactionTitle: e.target.value })}
                                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                                            Transaction Description
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Optional details about this adjustment"
                                            value={formData.transactionDescription}
                                            onChange={(e) => setFormData({ ...formData, transactionDescription: e.target.value })}
                                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-zinc-900 dark:text-white focus:outline-hidden focus:border-yellow-500 resize-none text-sm"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-zinc-900 dark:text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
