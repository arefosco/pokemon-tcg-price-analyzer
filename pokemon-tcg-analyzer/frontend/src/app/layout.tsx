import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pokemon TCG Analyzer',
  description: 'Find arbitrage opportunities in Pokemon TCG cards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-yellow-400">🃏 Pokemon TCG Analyzer</a>
            <div className="flex gap-4">
              <a href="/" className="hover:text-yellow-400">Opportunities</a>
              <a href="/cards" className="hover:text-yellow-400">Cards</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
