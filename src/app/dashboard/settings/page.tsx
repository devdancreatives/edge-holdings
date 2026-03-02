'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Palette, LogOut, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { CHANGE_PASSWORD } from '@/graphql/queries'
import { supabase } from '@/lib/supabase'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export default function SettingsPage() {
    const router = useRouter()
    const { isSubscribed, subscribeToPush, unsubscribeFromPush, requestPermission, permission } = usePushNotifications()
    const [notifications, setNotifications] = useState({
        email: true,
        weekly: true,
    })

    // Change Password State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD)

    // Sign Out State
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Passwords do not match")
            return
        }
        if (passwordData.newPassword.length < 6) {
            alert("Password must be at least 6 characters")
            return
        }

        try {
            await changePassword({
                variables: { password: passwordData.newPassword }
            })
            alert("Password updated successfully")
            setIsPasswordModalOpen(false)
            setPasswordData({ newPassword: '', confirmPassword: '' })
        } catch (e: any) {
            alert(e.message || "Failed to update password")
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <SettingsIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-sm text-zinc-400">Manage your account preferences</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Notifications */}
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Email Notifications</p>
                                <p className="text-sm text-zinc-400">Receive updates via email</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                                className={`relative w-12 h-6 rounded-full transition-all ${notifications.email ? 'bg-yellow-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Push Notifications</p>
                                <p className="text-sm text-zinc-400">
                                    {permission === 'denied'
                                        ? 'Notifications Blocked. Please reset in Device Settings.'
                                        : permission === 'default'
                                            ? 'Enable to receive updates'
                                            : 'Receive push notifications on this device'}
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (permission === 'denied') {
                                        alert("Please enable notifications for this app in your device/browser settings.")
                                        return
                                    }

                                    if (permission === 'default') {
                                        const result = await requestPermission?.()
                                        if (result !== 'granted') return
                                    }

                                    if (isSubscribed) {
                                        await unsubscribeFromPush()
                                    } else {
                                        await subscribeToPush()
                                    }
                                }}
                                className={`relative w-12 h-6 rounded-full transition-all ${isSubscribed ? 'bg-yellow-500' : 'bg-zinc-700'} ${permission === 'denied' ? 'opacity-50' : ''}`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isSubscribed ? 'translate-x-6' : ''}`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Weekly Reports</p>
                                <p className="text-sm text-zinc-400">Receive weekly performance reports</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, weekly: !notifications.weekly })}
                                className={`relative w-12 h-6 rounded-full transition-all ${notifications.weekly ? 'bg-yellow-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.weekly ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full text-left p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-yellow-500/50 hover:bg-zinc-800/50 transition-all text-white flex justify-between items-center"
                        >
                            <span>Change Password</span>
                            <Palette className="h-4 w-4 text-zinc-500" />
                        </button>
                        {/* 2FA Removed as requested */}
                    </div>
                </div>

                {/* Account Actions */}
                <div className="rounded-xl border border-red-900/20 bg-linear-to-br from-red-950/10 to-red-900/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <LogOut className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-white">Account Actions</h2>
                    </div>
                    <button
                        onClick={() => setIsSignOutModalOpen(true)}
                        className="w-full text-left p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-red-400 font-medium flex items-center gap-2"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h2 className="text-lg font-bold text-white">Change Password</h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-zinc-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="px-4 py-2 rounded text-zinc-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={changingPassword}
                                className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium disabled:opacity-50"
                            >
                                {changingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sign Out Confirmation Modal */}
            {isSignOutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <LogOut className="h-6 w-6 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Sign Out?</h2>
                            <p className="text-zinc-400 mb-6">Are you sure you want to sign out of your account?</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsSignOutModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
