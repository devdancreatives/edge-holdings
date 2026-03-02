import { PublicNavbar } from '@/components/PublicNavbar'
import { Footer } from '@/components/Footer'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
            <PublicNavbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}
