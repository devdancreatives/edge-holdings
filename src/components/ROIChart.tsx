'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function ROIChart({ data }: { data: any[] }) {
    // Data expected: { date: string, profitAmount: number }[]
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-zinc-500">
                No ROI data available yet.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    labelStyle={{ color: '#a1a1aa' }}
                />
                <Line
                    type="monotone"
                    dataKey="profitAmount"
                    stroke="#eab308"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
