'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { User as UserIcon, Mail, Loader2, Check, Bell, BellOff } from 'lucide-react'
import { GET_ME, UPDATE_PROFILE, TEST_PUSH_NOTIFICATION } from '@/graphql/queries'
import { toast } from 'sonner'

export default function ProfilePage() {
    const { data, loading } = useQuery<any>(GET_ME)
    const [fullName, setFullName] = useState('')
    const [saved, setSaved] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE, {
        onCompleted: () => {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        },
        onError: (error: Error) => {
            setError(error.message)
        }
    })

    const [testPush, { loading: sendingPush }] = useMutation(TEST_PUSH_NOTIFICATION, {
        onCompleted: () => {
            toast.success('Test notification sent!')
        },
        onError: (err) => {
            toast.error('Failed to send notification: ' + err.message)
        }
    })

    // Set initial fullName when data loads
    useEffect(() => {
        if (data?.me?.fullName) {
            setFullName(data.me.fullName)
        }
    }, [data])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaved(false)

        try {
            await updateProfile({
                variables: { fullName }
            })
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    const user = data?.me

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <UserIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your personal information</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSave} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                            Email Address
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-700">
                            <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="flex-1 bg-transparent text-zinc-900 dark:text-white outline-none"
                            />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                            Full Name
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-700 focus-within:border-yellow-500 transition-all">
                            <UserIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="flex-1 bg-transparent text-zinc-900 dark:text-white outline-none"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={saving || fullName === user?.fullName}
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 text-zinc-900 font-semibold hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>

                            {saved && (
                                <div className="flex items-center gap-2 text-green-500 animate-fade-in">
                                    <Check className="h-4 w-4" />
                                    <span className="text-sm">Saved successfully!</span>
                                </div>
                            )}
                        </div>

                        
                    </div>
                </form>
            </div>
        </div>
    )
}
