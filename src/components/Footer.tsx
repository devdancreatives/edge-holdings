import Link from 'next/link'

export function Footer() {
    return (
        <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-yellow-500" />
                            <span className="text-lg font-bold text-white">EdgePoint Holdings</span>
                        </div>
                        <p className="text-sm text-zinc-400">
                            Where human expertise meets AI precision for optimal crypto returns.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">Platform</h3>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li><Link href="/" className="hover:text-yellow-500">Home</Link></li>
                            <li><Link href="/login" className="hover:text-yellow-500">Login</Link></li>
                            <li><Link href="/dashboard" className="hover:text-yellow-500">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">Legal</h3>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li><Link href="/privacy" className="hover:text-yellow-500">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-yellow-500">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">Connect</h3>
                        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                            <li><a href="#" className="hover:text-yellow-500">Twitter</a></li>
                            <li><a href="#" className="hover:text-yellow-500">Telegram</a></li>
                            <li><a href="#" className="hover:text-yellow-500">Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
                    &copy; {new Date().getFullYear()} EdgePoint Holdings. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
