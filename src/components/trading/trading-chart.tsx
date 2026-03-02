'use client'

import React, { useEffect, useState, useRef } from 'react'
import { LineChart, Line, YAxis, ResponsiveContainer, XAxis, ReferenceLine } from 'recharts'
// Removed Card import as it does not exist used div instead

interface TradingChartProps {
    isTrading: boolean
    direction: 'UP' | 'DOWN' | null
    result: 'WIN' | 'LOSS' | null // Current expected result of the trade
    onPriceUpdate: (price: number) => void
    sessionTimeLeft: number
}

// Generate realistic-looking random walk data
const generateNextPrice = (currentPrice: number, volatility: number = 0.5) => {
    const change = (Math.random() - 0.5) * volatility
    return currentPrice + change
}

// Biased generator for "AI" mode
const generateBiasedPrice = (currentPrice: number, targetDirection: 'UP' | 'DOWN', intensity: number = 0.8) => {
    // If UP, random is 0.2 to 1.2 (avg +0.7). If standard random is -0.5 to 0.5.
    // Let's explicitly skew it.
    const bias = targetDirection === 'UP' ? 0.3 : -0.3
    const change = (Math.random() - 0.5 + bias) * intensity
    return currentPrice + change
}

export function TradingChart({ isTrading, direction, result, onPriceUpdate, sessionTimeLeft }: TradingChartProps) {
    const [data, setData] = useState<{ time: number, price: number }[]>([])
    const currentPriceRef = useRef(150.00) // Starting synthetic price
    const entryPriceRef = useRef<number | null>(null)

    useEffect(() => {
        // Init initial data
        const initialData = []
        let price = currentPriceRef.current
        for (let i = 0; i < 50; i++) {
            price = generateNextPrice(price)
            initialData.push({ time: i, price })
        }
        currentPriceRef.current = price
        setData(initialData)
    }, [])

    useEffect(() => {
        if (isTrading && entryPriceRef.current === null) {
            entryPriceRef.current = currentPriceRef.current
        } else if (!isTrading) {
            entryPriceRef.current = null
        }
    }, [isTrading])

    useEffect(() => {
        const interval = setInterval(() => {
            let nextPrice

            // Logic: 
            // If Trading AND WIN -> Bias towards direction.
            // If Trading AND LOSS -> Bias against direction.
            // Else -> Random walk.

            if (isTrading && direction && result) {
                const targetDir = result === 'WIN' ? direction : (direction === 'UP' ? 'DOWN' : 'UP')
                // Increase intensity as time runs out to ensure result?
                nextPrice = generateBiasedPrice(currentPriceRef.current, targetDir, 1.2)
            } else {
                nextPrice = generateNextPrice(currentPriceRef.current)
            }

            currentPriceRef.current = nextPrice
            onPriceUpdate(nextPrice)

            setData(prev => {
                const newData = [...prev, { time: Date.now(), price: nextPrice }]
                if (newData.length > 50) newData.shift()
                return newData
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isTrading, direction, result, onPriceUpdate])

    const min = Math.min(...data.map(d => d.price))
    const max = Math.max(...data.map(d => d.price))

    return (
        <div className="p-4 h-[400px] w-full bg-white dark:bg-zinc-950/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-2xl shadow-xl shadow-black/20 relative overflow-hidden group">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none" />
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis
                        domain={[min - 1, max + 1]}
                        hide={true}
                    />
                    <XAxis hide={true} />
                    {entryPriceRef.current && (
                        <ReferenceLine y={entryPriceRef.current} stroke="#fbbf24" strokeDasharray="3 3" />
                    )}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        fill="url(#colorPrice)"
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="absolute top-4 right-4 text-zinc-900 dark:text-white text-2xl font-mono">
                ${currentPriceRef.current.toFixed(4)}
            </div>
            {/* Overlay for session state? Or handled by parent? */}
            {sessionTimeLeft > 30 && sessionTimeLeft < 60 && (
                <div className="absolute top-4 left-4 text-xs text-yellow-500 font-mono animate-pulse">
                    WAITING FOR NEXT ENTRY WINDOW
                </div>
            )}
        </div>
    )
}
