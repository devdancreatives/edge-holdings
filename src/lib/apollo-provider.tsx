'use client'
import { useMemo } from 'react'

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './auth-context'

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth()

    const client = useMemo(() => {
        const httpLink = new HttpLink({
            uri: '/api/graphql',
        })

        const authLink = setContext((_, { headers }) => {
            const token = session?.access_token
            return {
                headers: {
                    ...headers,
                    authorization: token ? `Bearer ${token}` : '',
                },
            }
        })

        return new ApolloClient({
            link: authLink.concat(httpLink),
            cache: new InMemoryCache(),
        })
    }, [session?.access_token])

    return <ApolloProvider client={client}>{children}</ApolloProvider>
}
