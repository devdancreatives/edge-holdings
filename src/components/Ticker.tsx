'use client'

import { useEffect, useState } from 'react'

const MOCK_PRICES = [
    { pair: 'BTC/USDT', price: 96543.20, change: 2.4 },
    { pair: 'ETH/USDT', price: 3452.10, change: -1.2 },
    { pair: 'SOL/USDT', price: 102.45, change: 5.6 },
    { pair: 'BNB/USDT', price: 612.30, change: 0.8 },
    { pair: 'XRP/USDT', price: 1.12, change: -0.5 },
    { pair: 'ADA/USDT', price: 0.45, change: 1.1 },
    { pair: 'TRX/USDT', price: 0.14, change: 0.2 },
    { pair: 'DOT/USDT', price: 6.78, change: -2.3 },
]

export function Ticker() {
    return (
        <div className="w-full bg-zinc-950 border-b border-zinc-800 overflow-hidden py-2">
            <div className="flex animate-scroll whitespace-nowrap">
                {[...MOCK_PRICES, ...MOCK_PRICES, ...MOCK_PRICES].map((item, i) => (
                    <div key={i} className="mx-6 flex items-center gap-2 text-sm font-mono">
                        <span className="text-zinc-400 font-bold">{item.pair}</span>
                        <span className="text-white">${item.price.toFixed(2)}</span>
                        <span className={item.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {item.change >= 0 ? '+' : ''}{item.change}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
