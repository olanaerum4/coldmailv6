import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'OutreachOS',
  description: 'Cold email automation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} bg-zinc-950 text-zinc-100 antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
