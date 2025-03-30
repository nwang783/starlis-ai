import type React from "react"
import ProtectedRoute from "@/components/protected-route"
import { NoiseTexture } from "@/components/noise-texture"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <NoiseTexture className="flex-1 flex flex-col h-full w-full">{children}</NoiseTexture>
    </ProtectedRoute>
  )
}

