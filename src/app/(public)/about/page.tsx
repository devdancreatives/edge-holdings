export default function AboutPage() {
    return (
        <div className="mx-auto max-w-4xl px-6 py-24 text-zinc-700 dark:text-zinc-300">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">About EdgePoint Holdings</h1>

            <div className="space-y-6 text-lg leading-relaxed">
                <p>
                    EdgePoint Holdings was founded on a simple yet powerful premise: <strong className="text-yellow-500">Human intuition coupled with AI precision yields the best market results.</strong>
                </p>

                <p>
                    In an era dominated by algorithmic trading bots that often fail during black swan events, we believe in the power of expert human oversight. Our traders are seasoned professionals with years of experience in crypto markets, supported by our proprietary AI signals that analyze market sentiment, on-chain data, and technical indicators in real-time.
                </p>

                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">Our Mission</h2>
                <p>
                    To democratize access to institutional-grade crypto trading strategies, providing a transparent, secure, and profitable platform for investors of all sizes.
                </p>

                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-12 mb-4">How We Work</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Capital Collection:</strong> We pool investor funds to access high-volume trading opportunities.</li>
                    <li><strong>Strategic Deployment:</strong> Funds are allocated across various high-liquidity pairs (BTC, ETH, SOL).</li>
                    <li><strong>Risk Management:</strong> Strict stop-loss protocols and cold storage custody ensure capital preservation.</li>
                    <li><strong>Profit Distribution:</strong> Profits are realized weekly and distributed directly to your dashboard.</li>
                </ul>
            </div>
        </div>
    )
}
