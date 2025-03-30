"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function PaperTextureBackground() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-[-1]",
        "bg-repeat opacity-[0.02]",
        isDarkMode ? "bg-white mix-blend-overlay" : "bg-black mix-blend-multiply",
      )}
      style={{
        backgroundImage: 'url("/noise.png")',
        backgroundSize: "256px 256px",
      }}
      aria-hidden="true"
    />
  )
}

