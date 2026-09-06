'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  Menu, Search, Plus, CircleHelp, Activity, Settings, ChevronDown,
} from 'lucide-react'
import { useSidebarStore } from '@/store/sidebar.store'
import { SidebarToggle } from '@/components/layout/Sidebar'
import { navConfig } from '@/lib/constants'

// ─── Derive page title from current path ─────────────────────────────────────

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

// ─── Header Component ─────────────────────────────────────────────────────────

export function Header() {
  const { openMobile } = useSidebarStore()
  const title = usePageTitle()

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'b') {
        e.preventDefault()
        useSidebarStore.getState().toggle()
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        document.getElementById('header-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <header className="flex h-[82px] shrink-0 items-center gap-4 border-b border-border bg-card px-5 lg:px-8">
      {/* Mobile menu button */}
      <button
        onClick={openMobile}
        className="rounded-lg p-2 hover:bg-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu />
      </button>

      {/* Sidebar toggle (desktop) + Page title */}
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <h1 className="text-[25px] font-bold tracking-tight">{title}</h1>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <label className="hidden h-11 w-[280px] cursor-text items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-muted-foreground xl:flex">
          <Search className="size-5 shrink-0" />
          <input
            id="header-search"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search for anything here…"
          />
        </label>

        {/* New / Create button */}
        <button
          className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          aria-label="Create"
        >
          <Plus />
        </button>

        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted sm:block" aria-label="Help">
          <CircleHelp />
        </button>
        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted md:block" aria-label="Activity">
          <Activity />
        </button>
        <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Settings">
          <Settings />
        </button>

        {/* User profile */}
        <div className="hidden items-center gap-3 border-l border-border pl-4 md:flex">
          <div className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-primary">
            DS
          </div>
          <div>
            <p className="text-sm font-semibold">Darrell Steward</p>
            <p className="text-xs text-muted-foreground">Super admin</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
