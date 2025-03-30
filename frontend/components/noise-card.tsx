import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NoiseTexture } from "@/components/noise-texture"

interface NoiseCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function NoiseCard({ title, children, className }: NoiseCardProps) {
  return (
    <NoiseTexture opacity={0.01}>
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </NoiseTexture>
  )
}

