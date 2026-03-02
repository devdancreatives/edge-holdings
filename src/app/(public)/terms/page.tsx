export default function TermsPage() {
    return (
        <div className="mx-auto max-w-4xl px-6 py-24 text-zinc-700 dark:text-zinc-300">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">Terms of Service</h1>
            <p className="mb-8 text-zinc-500">Last Updated: January 1, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using the EdgePoint Holdings platform, you agree to be bound by these Terms of Service. If you do not agree, do not access or use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. Investment Risks</h2>
                    <p className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-200">
                        <strong>Warning:</strong> Crypto trading involves high risk. Past performance is not indicative of future results. You may lose some or all of your invested capital.
                    </p>
                    <p className="mt-4">
                        EdgePoint Holdings targets a weekly ROI of 2-10%, but this is not guaranteed. Market volatility, regulatory changes, and other factors affect performance.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. Lock-in Periods</h2>
                    <p>
                        Funds invested in fixed-duration plans are locked for the selected duration (1-6 months). Early withdrawals are generally not permitted except in exceptional circumstances subject to administrative approval and potential penalties.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. Account Security</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials. EdgePoint Holdings is not liable for any loss resulting from unauthorized access to your account due to your negligence.
                    </p>
                </section>
            </div>
        </div>
    )
}
