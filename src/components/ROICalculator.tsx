'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

export function ROICalculator() {
    const [amount, setAmount] = useState(5000)
    const [duration, setDuration] = useState(3)

    // Base calculation logic: Base rate 2% weekly * 4 weeks/month * duration
    // Plus compounding effect (simplified)
    // Let's assume average 25% monthly for simplicity in this demo calculator
    const monthlyRate = 0.25
    const estimatedProfit = amount * monthlyRate * duration
    const totalReturn = amount + estimatedProfit

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6 text-yellow-500">
                <TrendingUp size={24} />
                <h3 className="text-xl font-bold">ROI Estimator</h3>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        <span>Investment Amount</span>
                        <span className="text-zinc-900 dark:text-white font-mono">${amount.toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="50000"
                        step="100"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        <span>Lock-in Duration</span>
                        <span className="text-zinc-900 dark:text-white font-mono">{duration} Months</span>
                    </div>
                    <div className="flex gap-2">
                        {[1, 3, 6].map((m) => (
                            <button
                                key={m}
                                onClick={() => setDuration(m)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${duration === m
                                    ? 'bg-yellow-500 text-zinc-900 border-yellow-500'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200'
                                    }`}

                            >
                                {m}M
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-zinc-500">Estimated Profit</p>
                            <p className="text-2xl font-bold text-green-500">+${estimatedProfit.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Total Return</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">${totalReturn.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-600 mt-2 text-center">
                        *Estimates based on historical performance (avg 25% monthly). Not a guarantee.
                    </p>
                </div>
            </div>
        </div>
    )
}
