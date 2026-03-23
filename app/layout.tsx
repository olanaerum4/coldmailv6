import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/ConditionalLayout'

export const metadata: Metadata = {
  title: 'OutreachOS',
  description: 'Cold email automation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'var(--font-mono)', background: 'var(--bg)' }}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
