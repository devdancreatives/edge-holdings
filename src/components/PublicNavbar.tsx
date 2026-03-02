'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'

export function PublicNavbar() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => setIsOpen(!isOpen)



    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    }

    return (
        <>
            <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 z-50 relative">
                            <div className="h-8 w-8 rounded-full bg-yellow-500" />
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">EdgePoint Holdings</span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/about" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                                About
                            </Link>
                            <Link href="/terms" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                                Terms
                            </Link>
                            <Link href="/privacy" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                                Privacy
                            </Link>
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-yellow-400 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-700 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                            <ThemeToggle />
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden z-50 relative flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={toggleMenu}
                                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-700 focus:outline-hidden"
                            >
                                <AnimatePresence mode="wait">
                                    {isOpen ? (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <X className="h-6 w-6" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Menu className="h-6 w-6" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:hidden"
                        onClick={toggleMenu} // Close when clicking backdrop
                        style={{ height: '100dvh' }} // Ensure full height on mobile
                    >
                        {/* Menu Content Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                        >
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-lg font-bold text-zinc-900 dark:text-white">Menu</span>
                                <button
                                    onClick={toggleMenu}
                                    className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-700 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <Link
                                    href="/"
                                    className="block rounded-lg px-4 py-3 text-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition-colors"
                                    onClick={toggleMenu}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/about"
                                    className="block rounded-lg px-4 py-3 text-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition-colors"
                                    onClick={toggleMenu}
                                >
                                    About
                                </Link>
                                <Link
                                    href="/terms"
                                    className="block rounded-lg px-4 py-3 text-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition-colors"
                                    onClick={toggleMenu}
                                >
                                    Terms
                                </Link>
                                <Link
                                    href="/privacy"
                                    className="block rounded-lg px-4 py-3 text-lg font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition-colors"
                                    onClick={toggleMenu}
                                >
                                    Privacy
                                </Link>

                                <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    {user ? (
                                        <Link
                                            href="/dashboard"
                                            className="block w-full rounded-lg bg-yellow-500 px-4 py-3 text-center text-base font-bold text-zinc-900 hover:bg-yellow-400 transition-colors"
                                            onClick={toggleMenu}
                                        >
                                            Go to Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="block w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-center text-base font-bold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-700 transition-colors"
                                            onClick={toggleMenu}
                                        >
                                            Sign In
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
