export default function PrivacyPage() {
    return (
        <div className="mx-auto max-w-4xl px-6 py-24 text-zinc-700 dark:text-zinc-300">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">Privacy Policy</h1>
            <p className="mb-8 text-zinc-500">Last Updated: January 1, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, make a deposit, or communicate with us. This includes:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>Account Information (Email, Name)</li>
                        <li>Financial Information (Wallet addresses, Transaction history)</li>
                        <li>Usage Data (Login timestamps, Dashboard interactions)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">2. How We Use Your Information</h2>
                    <p>
                        We use your information to operate, maintain, and improve our services, including:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>Processing deposits and withdrawals</li>
                        <li>Calculating and distributing ROI</li>
                        <li>Sending security alerts and administrative messages</li>
                        <li>Preventing fraud and ensuring platform security</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">3. Data Security</h2>
                    <p>
                        We implement industry-standard security measures to protect your personal and financial data. However, no method of transmission over the Internet is 100% secure. We store the majority of assets in cold wallets to minimize online risk.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">4. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at privacy@edgepoint-holdings.com.
                    </p>
                </section>
            </div>
        </div>
    )
}
