'use client'

import { AuthProvider } from '@/lib/auth-context'
import { GraphQLProvider } from '@/lib/apollo-provider'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
            <AuthProvider>
                <GraphQLProvider>
                    {children}
                    <Toaster richColors position="top-right" theme="system" />
                </GraphQLProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
