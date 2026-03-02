'use client'

import { AuthProvider } from '@/lib/auth-context'
import { GraphQLProvider } from '@/lib/apollo-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <GraphQLProvider>
                {children}
                <Toaster richColors position="top-right" theme="dark" />
            </GraphQLProvider>
        </AuthProvider>
    )
}
