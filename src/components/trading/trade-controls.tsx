'use client'

import React, { useState } from 'react'
import { ArrowUp, ArrowDown, XCircle } from 'lucide-react'

interface TradeControlsProps {
    balance: number
    isTrading: boolean
    isLoading: boolean // Added isLoading prop
    currentProfit: number
    stake: number
    sessionTimeLeft: number
    onStartTrade: (amount: number, direction: 'UP' | 'DOWN') => void
    onCloseTrade: () => void
    canCloseEarly: boolean
}

export function TradeControls({
    balance,
    isTrading,
    isLoading,
    currentProfit,
    stake,
    sessionTimeLeft,
    onStartTrade,
    onCloseTrade,
    canCloseEarly
}: TradeControlsProps) {
    const [amount, setAmount] = useState('50') // Default $50
    const [error, setError] = useState<string | null>(null)
    const [loadingDir, setLoadingDir] = useState<'UP' | 'DOWN' | null>(null) // Track which button is loading

    // If loading, can't enter. If trading, can't enter. 
    // Time check remains strict.
    const canEnter = !isTrading && !isLoading && sessionTimeLeft <= 30 && sessionTimeLeft > 0

    const handleTrade = (direction: 'UP' | 'DOWN') => {
        const val = parseFloat(amount)
        if (isNaN(val) || val <= 0) {
            setError('Invalid amount')
            return
        }
        if (val > balance) {
            setError('Insufficient balance')
            return
        }
        setError(null)
        setLoadingDir(direction)
        onStartTrade(val, direction)
    }

    // Calculate Multiplier e.g. 1.5x
    const multiplier = stake > 0 ? ((stake + currentProfit) / stake).toFixed(2) : '1.00'

    return (
        <div className="p-4 bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-xl shadow-black/20 text-white flex flex-col gap-3 h-full relative overflow-hidden transition-all duration-500">
            {/* Header: Balance */}
            <div className="flex justify-between items-center relative z-10">
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Balance</span>
                <span className="font-mono text-lg text-yellow-500 font-bold">${balance.toFixed(2)}</span>
            </div>

            {/* Input Section - Fades out when trading */}
            <div className={`flex flex-col gap-1 relative z-10 transition-opacity duration-300 ${isTrading ? 'opacity-0 pointer-events-none absolute top-14 left-4 right-4' : 'opacity-100'}`}>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Stake (USDT)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isTrading || isLoading}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 pl-6 text-base font-mono text-white focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none w-full transition-all disabled:opacity-50"
                    />
                </div>
                {error && (
                    <div className="text-red-500 text-[10px] bg-red-500/10 p-1.5 rounded border border-red-500/20">{error}</div>
                )}
            </div>

            {/* Trading Status (Multiplier) - Fades in when trading */}
            <div className={`flex flex-col gap-1 items-center justify-center py-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50 relative z-10 transition-all duration-500 transform ${isTrading ? 'opacity-100 translate-y-0 h-32' : 'opacity-0 -translate-y-4 absolute top-14 left-4 right-4 h-0 pointer-events-none'}`}>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Return</span>
                <div className={`text-4xl font-black font-mono tracking-tighter transition-colors duration-300 ${parseFloat(multiplier) >= 1 ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'text-red-400'}`}>
                    {multiplier}x
                </div>
                <span className={`text-xs font-mono ${currentProfit >= 0 ? 'text-zinc-400' : 'text-red-400/70'}`}>
                    {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)} USDT
                </span>
            </div>

            {/* Buttons Section - Swaps between Entry / Countdown */}
            <div className="relative z-10 mt-1 min-h-[90px] flex-1">
                {/* Entry Buttons */}
                <div className={`grid grid-cols-2 gap-2 transition-all duration-500 absolute inset-0 ${!isTrading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <button
                        onClick={() => handleTrade('UP')}
                        disabled={!canEnter || (isLoading && loadingDir !== 'UP')}
                        className={`group border h-20 rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${isLoading && loadingDir === 'UP' ? 'bg-green-500/20 border-green-500 animate-pulse' : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/50 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                    >
                        {isLoading && loadingDir === 'UP' ? (
                            <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                                <ArrowUp className="w-6 h-6 mb-1 text-green-400 group-hover:scale-110 transition-transform" />
                                <span className="text-green-400 font-bold tracking-widest text-sm">CALL</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleTrade('DOWN')}
                        disabled={!canEnter || (isLoading && loadingDir !== 'DOWN')}
                        className={`group border h-20 rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${isLoading && loadingDir === 'DOWN' ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                    >
                        {isLoading && loadingDir === 'DOWN' ? (
                            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                                <ArrowDown className="w-6 h-6 mb-1 text-red-400 group-hover:scale-110 transition-transform" />
                                <span className="text-red-400 font-bold tracking-widest text-sm">PUT</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Countdown / Close Button - Fade In */}
                <div className={`flex flex-col gap-3 transition-all duration-500 absolute inset-0 ${isTrading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="h-12 flex items-center justify-center gap-2 text-zinc-400 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed animate-pulse">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                        <span className="font-mono tracking-widest text-xs">RESOLVING IN 00:{sessionTimeLeft.toString().padStart(2, '0')}</span>
                    </div>

                    <button
                        onClick={onCloseTrade}
                        disabled={!canCloseEarly}
                        className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${canCloseEarly ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 scale-100' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95 opacity-50'}`}
                    >
                        {canCloseEarly ? (
                            <>
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm">TAKE PROFIT</span>
                            </>
                        ) : (
                            <span className="text-[10px] tracking-widest uppercase text-center">Early Close &gt; 1.5x</span>
                        )}
                    </button>
                </div>
            </div>

            {!isTrading && (
                <div className={`text-center mt-auto py-2 px-4 bg-black/20 rounded-lg border border-white/5 relative z-10 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center">
                        <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase text-left">
                            Next Round<br />
                            <span className="text-zinc-600 font-normal">
                                {sessionTimeLeft > 30 ? 'Locked' : 'Open'}
                            </span>
                        </div>
                        <div className={`text-xl font-mono font-bold ${sessionTimeLeft > 30 ? 'text-zinc-600' : 'text-blue-400'}`}>
                            00:{sessionTimeLeft.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
