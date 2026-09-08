'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Plus, MapPin } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebar.store'
import { SidebarToggle } from '@/components/layout/Sidebar'
import { navConfig } from '@/lib/constants'
import { MyAccountMenu } from '@/components/layout/MyAccountMenu'
import { defaultClinicConfig } from '@/lib/clinic-config'
import { BookingRequestBadge, WhatsAppSimulatorModal } from '@/features/whatsapp-agent'

function usePageTitle(): string {
  const pathname = usePathname()
  const allItems = navConfig.flatMap((g) => g.items)
  const match = allItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href + '/'))
  )
  return match?.label ?? 'Dashboard'
}

export function Header() {
  const router = useRouter()
  const { openMobile } = useSidebarStore()
  const title = usePageTitle()
  const [showLocationPopover, setShowLocationPopover] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'b') {
        e.preventDefault()
        useSidebarStore.getState().toggle()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <header className="flex h-[82px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-5 lg:px-8">
      {/* Mobile menu button */}
      <button
        onClick={openMobile}
        className="rounded-lg p-2 hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu />
      </button>

      {/* Sidebar toggle + Page title + Location Capsule */}
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <h1 className="text-[23px] font-bold tracking-tight text-foreground">{title}</h1>

        {/* Location & Status Capsule */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowLocationPopover(!showLocationPopover)}
            className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Main Center</span>
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open · 09:00 - 00:00
            </span>
          </button>

          {/* Location Popover */}
          {showLocationPopover && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowLocationPopover(false)} />
              <div className="absolute left-0 top-9 z-40 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl text-xs space-y-2">
                <h4 className="font-bold text-foreground">{defaultClinicConfig.name}</h4>
                <p className="text-muted-foreground">{defaultClinicConfig.address.suite}</p>
                <p className="text-muted-foreground">{defaultClinicConfig.address.street}, {defaultClinicConfig.address.city}</p>
                <div className="pt-2 border-t border-border flex justify-between text-sky-600 font-semibold">
                  <span>{defaultClinicConfig.contact.phone}</span>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(defaultClinicConfig.name)}`} target="_blank" rel="noreferrer" className="hover:underline">
                    Google Maps →
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* WhatsApp Inbound Requests Badge */}
        <BookingRequestBadge onOpenSimulator={() => setSimulatorOpen(true)} />

        {/* Quick Walk-In / Create button */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/reservations')) {
              window.dispatchEvent(new CustomEvent('open-walkin-sheet'))
            } else {
              router.push('/reservations?walkin=true')
            }
          }}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition active:scale-95 cursor-pointer"
          aria-label="Quick Walk-In"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Walk-In</span>
        </button>

        {/* My Account Staff Hub Dropdown */}
        <MyAccountMenu />

        {/* Floating WhatsApp Simulator Modal */}
        <WhatsAppSimulatorModal open={simulatorOpen} onClose={() => setSimulatorOpen(false)} />
      </div>
    </header>
  )
}

