'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarCheck, Users, Stethoscope, UserCog,
  Wallet, TrendingUp, ShoppingCart, CreditCard,
  Package, Monitor, BarChart3, Headphones,
  ShieldCheck, CircleHelp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useSidebarStore } from '@/store/sidebar.store'
import { navConfig } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// ─── Icon Map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Stethoscope,
  UserCog,
  Wallet,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Package,
  Monitor,
  BarChart3,
  Headphones,
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? LayoutDashboard
  return <Icon className={className} aria-hidden="true" />
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore()
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border/70 bg-card lg:flex lg:flex-col',
        'overflow-hidden transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-[76px]' : 'w-[236px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-[92px] shrink-0 items-center border-b border-border/60',
          isCollapsed ? 'justify-center px-0' : 'gap-3 px-7'
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
            <path
              d="M12 2.5C7.5 2.5 4 5 4 9C4 12 5 14.5 6 17.5C7 20.5 8.5 22 10 22C11 22 11.5 20.5 12 18.5C12.5 20.5 13 22 14 22C15.5 22 17 20.5 18 17.5C19 14.5 20 12 20 9C20 5 16.5 2.5 12 2.5Z"
              fill="currentColor"
            />
            <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.8" />
          </svg>
        </div>
        {!isCollapsed && (
          <span className="whitespace-nowrap text-[23px] font-bold tracking-tight text-foreground">
            Clinix
          </span>
        )}
      </div>

      {/* Clinic Card */}
      {!isCollapsed && (
        <div className="shrink-0 border-b border-border/60 p-5">
          <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Avicena Clinic</p>
              <p className="truncate text-xs text-muted-foreground">
                845 Euclid Avenue, CA
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-2 py-5">
        {navConfig.map((group) => (
          <div key={group.section ?? '__other'} className="mb-6">
            {!isCollapsed && group.section && (
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {group.section}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex w-full items-center rounded-lg px-3 py-3 text-left text-[15px] font-medium transition',
                    isCollapsed ? 'justify-center' : 'gap-3',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <NavIcon name={item.icon} className="size-[18px] shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Help Center */}
      <div className="shrink-0 border-t border-border/60 p-4">
        <button
          className={cn(
            'flex w-full items-center rounded-lg p-3 text-left text-sm text-muted-foreground transition hover:bg-muted',
            isCollapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <CircleHelp className="size-5 shrink-0" />
          {!isCollapsed && <span>Help center</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Mobile Sidebar Drawer ────────────────────────────────────────────────────

export function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebarStore()
  const pathname = usePathname()

  if (!isMobileOpen) return null

  return (
    <div
      className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
      onClick={closeMobile}
    >
      <div
        className="h-full w-[260px] bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[92px] items-center gap-3 border-b border-border/60 px-7">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
              <path
                d="M12 2.5C7.5 2.5 4 5 4 9C4 12 5 14.5 6 17.5C7 20.5 8.5 22 10 22C11 22 11.5 20.5 12 18.5C12.5 20.5 13 22 14 22C15.5 22 17 20.5 18 17.5C19 14.5 20 12 20 9C20 5 16.5 2.5 12 2.5Z"
                fill="currentColor"
              />
              <circle cx="9" cy="8" r="1.5" fill="white" opacity="0.8" />
            </svg>
          </div>
          <span className="whitespace-nowrap text-[23px] font-bold tracking-tight text-foreground">
            Clinix
          </span>
        </div>
        <nav className="flex-1 overflow-auto px-4 py-5">
          {navConfig.map((group) => (
            <div key={group.section ?? '__other'} className="mb-6">
              {group.section && (
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] font-medium transition',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <NavIcon name={item.icon} className="size-[18px] shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge != null && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ─── Sidebar Toggle Button (used inside Header) ───────────────────────────────

export function SidebarToggle() {
  const { isCollapsed, toggle } = useSidebarStore()
  return (
    <button
      onClick={toggle}
      className="hidden rounded-lg p-2 transition hover:bg-muted lg:block"
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <ChevronRight className="size-5" />
      ) : (
        <ChevronLeft className="size-5" />
      )}
    </button>
  )
}
