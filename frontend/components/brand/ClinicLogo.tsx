"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ClinicLogoProps {
  variant?: "full" | "compact" | "icon-only" | "monochrome"
  className?: string
  iconSize?: number
}

export function ClinicLogo({ variant = "full", className, iconSize = 36 }: ClinicLogoProps) {
  const isMonochrome = variant === "monochrome"

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Clinic Image Logo */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl shadow-sm transition-transform duration-200 hover:scale-105 shrink-0 overflow-hidden bg-white",
          isMonochrome && "brightness-0 invert dark:invert-0"
        )}
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src="/logo.png"
          alt="Clinic Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Wordmark Text */}
      {variant !== "icon-only" && (
        <div className="flex flex-col">
          <div className="flex items-baseline tracking-tight font-bold leading-none text-lg">
            <span className={cn(isMonochrome ? "text-current" : "text-slate-900 dark:text-white")}>
              Clinix
            </span>
            <span className={cn("ml-1 font-semibold", isMonochrome ? "opacity-80" : "text-sky-600 dark:text-sky-400")}>
              Dental
            </span>
          </div>

          {variant === "full" && (
            <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400 mt-0.5">
              Specialty Clinic & Surgery
            </span>
          )}
        </div>
      )}
    </div>
  )
}
