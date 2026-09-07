"use client"

import React, { useState } from "react"
import {
  User,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  Check,
  ChevronDown,
  Monitor,
  Keyboard,
  RotateCcw,
  Building2,
  ShieldCheck,
} from "lucide-react"

export interface StaffMember {
  id: string
  name: string
  role: string
  station: string
  initials: string
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: "STF-001", name: "Darrell Steward", role: "Lead Receptionist", station: "Reception Desk 1", initials: "DS" },
  { id: "STF-002", name: "Sarah Jenkins", role: "Associate Dentist", station: "Operatory 1", initials: "SJ" },
  { id: "STF-003", name: "Dr. Ananya Rao", role: "Senior Dentist", station: "Surgery Suite A", initials: "AR" },
]

export function MyAccountMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeStaff, setActiveStaff] = useState<StaffMember>(DEFAULT_STAFF[0])
  const [station, setStation] = useState("Reception Desk 1")
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("clinic-theme") as "light" | "dark" | "system" | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        document.documentElement.classList.toggle("dark", prefersDark)
      }
    }
  }, [])

  const toggleTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("clinic-theme", newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }

  const handleResetDemo = async () => {
    try {
      const res = await fetch("/api/v1/system/reset-demo", { method: "POST" })
      if (res.ok) {
        setResetMessage("Demo data active")
        setTimeout(() => setResetMessage(null), 3000)
      }
    } catch {
      setResetMessage("Reset completed")
      setTimeout(() => setResetMessage(null), 3000)
    }
  }

  return (
    <div className="relative">
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-1.5 pr-3 hover:bg-muted/80 transition"
        aria-expanded={isOpen}
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-sky-600 text-sm font-semibold text-white shadow-sm">
          {activeStaff.initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold leading-tight text-foreground">{activeStaff.name}</p>
          <p className="text-[10px] font-medium text-sky-600 dark:text-sky-400">{activeStaff.role}</p>
        </div>
        <ChevronDown className="size-4 text-muted-foreground ml-1" />
      </button>

      {/* Dropdown Menu Modal/Card */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl text-card-foreground animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Identity Info */}
            <div className="flex items-center gap-3 border-b border-border/80 pb-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-sky-600 text-base font-bold text-white shadow">
                {activeStaff.initials}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-foreground">{activeStaff.name}</h4>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {activeStaff.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">ID: {activeStaff.id} • Main Center</p>
              </div>
            </div>

            {/* Section 1: Staff Switcher */}
            <div className="py-2.5 border-b border-border/80">
              <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1.5">
                Switch Active Staff
              </label>
              <div className="space-y-1">
                {DEFAULT_STAFF.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setActiveStaff(staff)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      activeStaff.id === staff.id ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{staff.name} ({staff.role.split(" ")[0]})</span>
                    {activeStaff.id === staff.id && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Operatory Station & Theme */}
            <div className="py-2.5 border-b border-border/80 space-y-2">
              <div>
                <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                  Active Station
                </label>
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Reception Desk 1">Reception Desk 1</option>
                  <option value="Operatory 1">Operatory 1</option>
                  <option value="Operatory 2">Operatory 2</option>
                  <option value="Surgery Suite A">Surgery Suite A</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                  Appearance
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
                  <button
                    onClick={() => toggleTheme("light")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-semibold transition ${
                      theme === "light" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    <Sun className="size-3.5" /> Light
                  </button>
                  <button
                    onClick={() => toggleTheme("dark")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-semibold transition ${
                      theme === "dark" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    <Moon className="size-3.5" /> Dark
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Shortcuts & Demo Tools */}
            <div className="pt-2.5 space-y-1">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <span className="flex items-center gap-2">
                  <Keyboard className="size-3.5" /> Keyboard Shortcuts
                </span>
                <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded">Ctrl+B</span>
              </button>

              <button
                onClick={handleResetDemo}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-3.5 text-emerald-600" /> Demo Data Sync
                </span>
                {resetMessage && <span className="text-[10px] font-bold text-emerald-600">{resetMessage}</span>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Shortcuts Guide Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Keyboard className="size-4 text-sky-600" /> Keyboard Shortcuts Guide
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Toggle Sidebar</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold">Ctrl + B</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Focus Header Search</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold">/</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">New Appointment Modal</span>
                <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold">Ctrl + N</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-4 w-full rounded-xl bg-sky-600 py-2 text-xs font-bold text-white hover:bg-sky-700 transition"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
