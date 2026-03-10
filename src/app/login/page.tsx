'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useMutation } from '@apollo/client/react'
import { REQUEST_OTP, REGISTER_WITH_OTP } from '@/graphql/queries'
import { PublicNavbar } from '@/components/PublicNavbar'
import Image from 'next/image'


function LoginContent() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  useEffect(() => {
    const ref = searchParams?.get('ref')
    if (ref) {
      setReferralCode(ref.toUpperCase())
      if (!isSignUp) setIsSignUp(true)
    }
  }, [searchParams])

  const [requestOtp] = useMutation(REQUEST_OTP, {
    onCompleted: () => {
      setShowOtpInput(true)
      setLoading(false)
    },
    onError: (err) => {
      setError(err.message)
      setLoading(false)
    }
  })

  const [registerWithOtp] = useMutation(REGISTER_WITH_OTP, {
    onCompleted: async () => {
      // Registration successful, now auto-login
      const { error: loginError } = await signIn(email, password)
      if (loginError) {
        setError(loginError.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    },
    onError: (err) => {
      setError(err.message)
      setLoading(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        if (showOtpInput) {
          // Finalize Registration with OTP and Password
          await registerWithOtp({
            variables: { email, otp, password, fullName, referralCode: referralCode || null }
          })
        } else {
          // Request OTP
          if (!email || !fullName || !password) {
            throw new Error("Please fill in all fields.")
          }
          await requestOtp({
            variables: { email, fullName }
          })
        }
      } else {
        // Login Flow
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      if (!isSignUp || !showOtpInput) setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8 backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-8 relative h-20 w-20">
              <Image src="/logo-v4.png" alt="EdgePoint Holdings" fill className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]" />
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">EdgePoint Holdings</h2>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {isSignUp ? (showOtpInput ? 'Verify your email' : 'Create your account') : 'Sign in to your portfolio'}
            </p>
          </div>


          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
              {isSignUp && !showOtpInput && (
                <>
                  <div>
                    <label htmlFor="fullName" className="sr-only">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="referralCode" className="sr-only">Referral Code (Optional)</label>
                    <input
                      id="referralCode"
                      name="referralCode"
                      type="text"
                      className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                      placeholder="Referral Code (Optional)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </>
              )}

              {!showOtpInput && (
                <>
                  <div>
                    <label htmlFor="email-address" className="sr-only">Email address</label>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              {showOtpInput && (
                <div>
                  <label htmlFor="otp" className="sr-only">Verification Code</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-center text-2xl font-bold tracking-widest text-yellow-500 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <div className="flex flex-col items-center mt-2 space-y-2">
                    <p className="text-xs text-zinc-500">
                      We sent a code to {email}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await requestOtp({ variables: { email, fullName } })
                        } catch {
                          // Error handled by mutation onError
                        }
                      }}
                      className="text-xs text-yellow-500 hover:text-yellow-400 underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-center text-sm text-red-500">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (
                  isSignUp
                    ? (showOtpInput ? 'Verify & Create Account' : 'Send Verification Code')
                    : 'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            {!showOtpInput && (
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setFullName('')
                  setReferralCode('')
                  setEmail('')
                  setPassword('')
                }}
                className="text-sm font-medium text-yellow-500 hover:text-yellow-400"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            )}
            {showOtpInput && (
              <button
                onClick={() => setShowOtpInput(false)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-600 dark:text-zinc-400"
              >
                Back to details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
