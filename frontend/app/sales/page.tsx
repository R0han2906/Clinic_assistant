'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/financials?tab=sales')
  }, [router])

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-sm font-medium">Redirecting to Financials & Invoicing Hub...</span>
    </div>
  )
}
