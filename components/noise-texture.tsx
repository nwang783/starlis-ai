"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface NoiseTextureProps {
  className?: string
  opacity?: number
  children?: React.ReactNode
}

export function NoiseTexture({ className, opacity = 0.025, children }: NoiseTextureProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn("relative", className)}>
      {children}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "url(/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          opacity: opacity,
        }}
        aria-hidden="true"
      />
    </div>
  )
}

