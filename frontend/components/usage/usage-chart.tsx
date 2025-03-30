"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for LLM token usage
const llmMockData = [
  { date: "2023-03-01", tokens: 125000 },
  { date: "2023-03-02", tokens: 142000 },
  { date: "2023-03-03", tokens: 98000 },
  { date: "2023-03-04", tokens: 134000 },
  { date: "2023-03-05", tokens: 187000 },
  { date: "2023-03-06", tokens: 143000 },
  { date: "2023-03-07", tokens: 165000 },
  { date: "2023-03-08", tokens: 132000 },
  { date: "2023-03-09", tokens: 176000 },
  { date: "2023-03-10", tokens: 145000 },
  { date: "2023-03-11", tokens: 156000 },
  { date: "2023-03-12", tokens: 189000 },
  { date: "2023-03-13", tokens: 167000 },
  { date: "2023-03-14", tokens: 154000 },
]

// Mock data for voice synthesis usage
const voiceMockData = [
  { date: "2023-03-01", seconds: 320 },
  { date: "2023-03-02", seconds: 280 },
  { date: "2023-03-03", seconds: 350 },
  { date: "2023-03-04", seconds: 290 },
  { date: "2023-03-05", seconds: 410 },
  { date: "2023-03-06", seconds: 380 },
  { date: "2023-03-07", seconds: 320 },
  { date: "2023-03-08", seconds: 290 },
  { date: "2023-03-09", seconds: 340 },
  { date: "2023-03-10", seconds: 390 },
  { date: "2023-03-11", seconds: 420 },
  { date: "2023-03-12", seconds: 380 },
  { date: "2023-03-13", seconds: 350 },
  { date: "2023-03-14", seconds: 310 },
]

interface UsageChartProps {
  type: "llm" | "voice"
  timeRange: string
}

export function UsageChart({ type, timeRange }: UsageChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      if (type === "llm") {
        setData(llmMockData.slice(-getTimeRangeDays(timeRange)))
      } else {
        setData(voiceMockData.slice(-getTimeRangeDays(timeRange)))
      }
      setLoading(false)
    }, 500)
  }, [type, timeRange])

  const getTimeRangeDays = (range: string) => {
    switch (range) {
      case "7d":
        return 7
      case "90d":
        return 14 // Mock data only has 14 days
      default:
        return 14
    }
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="#888888"
          fontSize={12}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickFormatter={(value) => (type === "llm" ? `${(value / 1000).toFixed(0)}k` : `${value}s`)}
        />
        <Tooltip
          formatter={(value: number) =>
            type === "llm" ? [`${value.toLocaleString()} tokens`, "Tokens"] : [`${value} seconds`, "Audio Length"]
          }
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }
        />
        <Bar dataKey={type === "llm" ? "tokens" : "seconds"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

