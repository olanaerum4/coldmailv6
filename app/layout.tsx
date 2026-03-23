import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const mono = { variable: '--font-mono' }

export const metadata: Metadata = {
  title: 'OutreachOS',
  description: 'Cold email automation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} antialiased`} style={{ fontFamily: 'var(--font-mono)' }}>
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
