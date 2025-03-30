"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

export function UsageSummary() {
  // Mock data
  const summaryData = {
    llm: {
      total: 2_134_567,
      change: 12.5,
      period: "month",
    },
    voice: {
      total: 4_321,
      change: -8.3,
      period: "month",
    },
    cost: {
      total: 78.42,
      change: 5.2,
      period: "month",
    },
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">LLM Tokens</CardTitle>
            <CardDescription>Total usage this month</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.llm.total.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summaryData.llm.change > 0 ? (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={summaryData.llm.change > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(summaryData.llm.change)}%
            </span>
            <span className="ml-1">from last {summaryData.llm.period}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Voice Synthesis</CardTitle>
            <CardDescription>Total seconds this month</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.voice.total.toLocaleString()} sec</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summaryData.voice.change > 0 ? (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={summaryData.voice.change > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(summaryData.voice.change)}%
            </span>
            <span className="ml-1">from last {summaryData.voice.period}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <CardDescription>Total cost this month</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryData.cost.total.toFixed(2)}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summaryData.cost.change > 0 ? (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span className={summaryData.cost.change > 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(summaryData.cost.change)}%
            </span>
            <span className="ml-1">from last {summaryData.cost.period}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

