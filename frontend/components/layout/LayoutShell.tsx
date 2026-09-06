'use client'

import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

interface LayoutShellProps {
  children: React.ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      <MobileSidebar />

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
