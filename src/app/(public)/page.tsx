import Link from 'next/link'
import Image from 'next/image'

import { TrendingUp, ShieldCheck, Users, Clock, ArrowRight, Quote } from 'lucide-react'
import { Ticker } from '@/components/Ticker'
import { ROICalculator } from '@/components/ROICalculator'

export default function LandingPage() {
    return (
        <div className="flex flex-col">
            <Ticker />
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    {/* <div className="flex justify-center mb-10">
                        <div className="relative h-24 w-64 md:h-32 md:w-80 animate-fade-in">
                            <Image src="/logo-v8.png" alt="EdgePoint Holdings" fill className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                        </div>
                    </div> */}
                    <div className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 text-sm font-medium text-yellow-500 mb-10 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-yellow-500 mr-2.5 animate-pulse"></span>
                        Now Accepting New Investors
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl md:text-8xl lg:leading-[1.1]">
                        Human Expertise. <br />
                        <span className="bg-linear-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">AI Precision.</span>
                    </h1>
                    <p className="mt-8 max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        EdgePoint Holdings merges veteran market intuition with high-frequency AI analysis to generate consistent, institutional-grade returns on your digital assets.
                    </p>

                    <div className="mt-10 flex justify-center gap-4">
                        <Link
                            href="/login"
                            className="rounded-full bg-yellow-500 px-8 py-4 text-base font-bold text-zinc-900 transition-all hover:bg-yellow-400 hover:scale-105"
                        >
                            Start Investing
                        </Link>
                        <Link
                            href="/about"
                            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-8 py-4 text-base font-semibold text-zinc-900 dark:text-white transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            Learn More
                        </Link>

                    </div>



                    <div className="mt-20 flex justify-center">
                        <div className="w-full max-w-xl text-left">
                            <ROICalculator />
                        </div>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y border-zinc-200 dark:border-zinc-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Why Choose EdgePoint Holdings?</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">We bridge the gap between complex crypto markets and passive income, ensuring your capital is managed by the best.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Users, title: 'Expert Traders', desc: 'Real humans managing your portfolio, not static algorithms.' },
                            { icon: TrendingUp, title: 'Superior ROI', desc: 'Targeting 5-15% weekly returns based on market conditions.' },
                            { icon: ShieldCheck, title: 'Secure Custody', desc: 'Funds secured in cold storage with strict access controls.' },
                            { icon: Clock, title: 'Flexible Terms', desc: 'Choose lock-in periods from 1 to 6 months to suit your goals.' }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-yellow-500/50 transition-colors">
                                <feature.icon className="h-10 w-10 text-yellow-500 mb-4" />
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">How It Works</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">Start growing your wealth in three simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up in seconds and secure your personal wallet.' },
                            { step: '02', title: 'Make Deposit', desc: 'Transfer USDT (BSC BEP20) to your dedicated deposit address.' },
                            { step: '03', title: 'Earn Rewards', desc: 'Watch your portfolio grow with weekly ROI distributions.' }
                        ].map((item, i) => (
                            <div key={i} className="relative p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                <div className="text-6xl font-bold text-yellow-500/10 absolute top-4 right-4">{item.step}</div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 relative z-10">{item.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-yellow-500">
                <div className="mx-auto max-w-7xl px-4 text-center">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-16">Platform Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8">
                            <div className="text-5xl font-bold text-zinc-900 mb-2">12k+</div>
                            <div className="text-zinc-800 font-medium">Active Investors</div>
                        </div>
                        <div className="p-8 md:border-l md:border-r border-zinc-900/10">
                            <div className="text-5xl font-bold text-zinc-900 dark:text-white mb-2">$800M</div>
                            <div className="text-zinc-800 font-medium">Assets Under Management</div>
                        </div>
                        <div className="p-8">
                            <div className="text-5xl font-bold text-zinc-900 mb-2">127%</div>
                            <div className="text-zinc-800 font-medium">Average Annual ROI</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">What Our Users Say</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Sarah J.', role: 'Early Investor', text: "I was skeptical at first, but EdgePoint Holdings has consistently delivered. The transparency is unmatched." },
                            { name: 'David M.', role: 'Crypto Trader', text: "Finally, a platform that combines the best of both worlds. The returns are stable and the platform is easy to use." },
                            { name: 'Elena R.', role: 'Business Owner', text: "The perfect way to diversify my portfolio without staring at charts all day. Highly recommended." }
                        ].map((t, i) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-900/30 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <Quote className="h-8 w-8 text-yellow-500 mb-4" />
                                <p className="text-zinc-700 dark:text-zinc-300 mb-6">"{t.text}"</p>
                                <div>
                                    <div className="font-bold text-zinc-900 dark:text-white">{t.name}</div>
                                    <div className="text-sm text-zinc-500">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
