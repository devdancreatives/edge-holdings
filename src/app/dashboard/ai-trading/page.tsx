'use client'

import React, { useState, useEffect, useRef } from 'react'
import { TradingChart } from '@/components/trading/trading-chart'
import { TradeControls } from '@/components/trading/trade-controls'
import { useMutation, useQuery } from '@apollo/client/react'
import { START_AI_TRADE, RESOLVE_AI_TRADE, GET_ME } from '@/graphql/queries'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function AiTradingPage() {
    // Session State
    const [timeLeft, setTimeLeft] = useState(60) // 0-60s loop

    // Trade State
    const [isTrading, setIsTrading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tradeDirection, setTradeDirection] = useState<'UP' | 'DOWN' | null>(null)
    const [tradeResult, setTradeResult] = useState<'WIN' | 'LOSS' | null>(null)
    const [stake, setStake] = useState(0)
    const [entryPrice, setEntryPrice] = useState(0)
    const [currentPrice, setCurrentPrice] = useState(0)
    const [tradeId, setTradeId] = useState<string | null>(null)

    // Mutations & Queries
    const { data: userData, refetch: refetchUser } = useQuery<any>(GET_ME)
    const [startTrade] = useMutation(START_AI_TRADE)
    const [resolveTrade] = useMutation(RESOLVE_AI_TRADE)

    // Global Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) return 60
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Start Trade Handler
    const handleStartTrade = async (amount: number, direction: 'UP' | 'DOWN') => {
        try {
            setIsSubmitting(true)
            const { data } = await startTrade({
                variables: { amount, type: direction }
            })

            await refetchUser()

            const returnedTradeId = (data as any)?.startAiTrade
            if (!returnedTradeId) {
                throw new Error('Failed to create trade')
            }

            setTradeId(returnedTradeId)
            setStake(amount)
            setTradeDirection(direction)
            setEntryPrice(currentPrice)
            setIsTrading(true)

            // Client does NOT know the outcome — show random visual bias for excitement
            // This is purely cosmetic; the real result comes from the server on resolve
            const visualBias = Math.random() < 0.5 ? 'WIN' : 'LOSS'
            setTradeResult(visualBias)

            toast.success(`Trade Started: ${direction} $${amount}`)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // End/Resolve Trade Handler
    const handleCloseTrade = async (reason: 'expired' | 'early_close') => {
        if (!isTrading || !tradeId) return

        try {
            const { data } = await resolveTrade({
                variables: { tradeId }
            })

            // Parse server response
            const result = JSON.parse((data as any)?.resolveAiTrade || '{}')
            const isWin = result.outcome === 'WIN'
            const profit = result.profit || 0

            if (result.expired) {
                toast.error('Trade expired — session timed out')
            } else if (isWin) {
                toast.success(`Trade Won! +$${profit.toFixed(2)}`)
            } else {
                toast.error('Trade Lost')
            }

            await refetchUser()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to resolve trade')
        } finally {
            setIsTrading(false)
            setTradeDirection(null)
            setTradeResult(null)
            setStake(0)
            setTradeId(null)
        }
    }

    // Auto-Close when session loops (if still trading)
    useEffect(() => {
        if (timeLeft === 1 && isTrading) {
            handleCloseTrade('expired')
        }
    }, [timeLeft, isTrading])

    const calcProfit = () => {
        if (!entryPrice || !currentPrice || !stake) return 0
        const isUp = tradeDirection === 'UP'
        const diffPercent = (currentPrice - entryPrice) / entryPrice * 1000
        const pnl = isUp ? diffPercent : -diffPercent

        // Cap max loss at -stake
        return Math.max(-stake, pnl * stake)
    }

    const currentProfit = calcProfit()
    const canCloseEarly = currentProfit >= (stake * 0.5) // 1.5x total = 0.5 profit

    if (!userData) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-yellow-500 w-8 h-8" /></div>

    return (
        <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto p-4 lg:p-0">
            {/* Background Gradient Element */}
            <div className="fixed top-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-20 left-20 w-64 h-64 bg-green-600/5 rounded-full blur-[128px] pointer-events-none" />

            <header className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-yellow-500 rounded-full" />
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        AI <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-yellow-600">Auto-Trading</span>
                    </h1>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm ml-4 pl-0.5 max-w-lg">
                    High-Frequency Quantum Trading Bot V4.2 running on <span className="text-yellow-500/80 font-mono">BSC-RPC-DATALSEED</span>
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Chart Section */}
                <div className="flex-1 min-h-[400px]">
                    <TradingChart
                        isTrading={isTrading}
                        direction={tradeDirection}
                        result={tradeResult}
                        onPriceUpdate={setCurrentPrice}
                        sessionTimeLeft={timeLeft}
                    />
                </div>

                {/* Controls Section */}
                <div className="w-full lg:w-80 shrink-0">
                    <TradeControls
                        balance={userData.me?.balance || 0}
                        isTrading={isTrading}
                        isLoading={isSubmitting}
                        currentProfit={currentProfit}
                        stake={stake}
                        sessionTimeLeft={timeLeft}
                        onStartTrade={handleStartTrade}
                        onCloseTrade={() => handleCloseTrade('early_close')}
                        canCloseEarly={canCloseEarly}
                    />
                    {/* Stats / Info */}
                    <div className="mt-4 p-4 rounded-xl bg-white dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/50 backdrop-blur-sm text-xs text-zinc-500 space-y-2 relative z-10">
                        <div className="flex justify-between">
                            <span>Win Rate (24h)</span>
                            <span className="text-green-400 font-mono">21.4%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Active Traders</span>
                            <span className="text-blue-400 font-mono">1,204</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Volatility</span>
                            <span className="text-yellow-400 font-mono">High</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
