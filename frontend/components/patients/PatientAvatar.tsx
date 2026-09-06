'use client'

import React, { useState } from 'react'

interface PatientAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function PatientAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}: PatientAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const initials = (name || 'P')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-base',
    xl: 'size-20 text-2xl',
  }

  // Fuchsia-first semantic palette matching reference screenshots
  const avatarColors = [
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  ]

  const charCode = (name || 'P').charCodeAt(0) || 0
  const colorClass = avatarColors[charCode % avatarColors.length]

  if (avatarUrl && !imageError) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold shadow-sm ${sizeClasses[size]} ${className}`}
      >
        {/* Safe image with standard error fallback */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold transition-transform select-none ${sizeClasses[size]} ${colorClass} ${className}`}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
