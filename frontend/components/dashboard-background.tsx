"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function DashboardBackground({ className, children }: DashboardBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn("relative w-full h-full min-h-screen", className)}>
      {/* Gradient Background */}
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-500/40 via-red-500/30 to-purple-600/40"
          style={{ opacity: 0.9 }}
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-600 to-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Noise Texture */}
      <div className="relative w-full h-full min-h-screen">
        {children}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/noise.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            opacity: 0.025,
            zIndex: 10,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

