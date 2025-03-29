"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsageChart } from "@/components/usage/usage-chart"
import { UsageSummary } from "@/components/usage/usage-summary"
import { UsageTable } from "@/components/usage/usage-table"
import { UsageQuota } from "@/components/usage/usage-quota"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState("30d")

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
        <p className="text-muted-foreground">Monitor your API usage and voice synthesis consumption</p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="llm">LLM</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <UsageSummary />

      <Tabs defaultValue="all" className="w-full">
        <TabsContent value="all">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>LLM Token Usage</CardTitle>
                <CardDescription>Token consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageChart type="llm" timeRange={timeRange} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Voice Synthesis Usage</CardTitle>
                <CardDescription>Audio generation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageChart type="voice" timeRange={timeRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>LLM Token Usage</CardTitle>
              <CardDescription>Token consumption over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <UsageChart type="llm" timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Synthesis Usage</CardTitle>
              <CardDescription>Audio generation over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <UsageChart type="voice" timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Usage Quotas</CardTitle>
          <CardDescription>Current billing period limits</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageQuota />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Detailed usage records</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageTable />
        </CardContent>
      </Card>
    </div>
  )
}

