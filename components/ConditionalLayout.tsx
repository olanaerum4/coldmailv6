'use client'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const isFounder = path.startsWith('/founder')

  if (isFounder) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
