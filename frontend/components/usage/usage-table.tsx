"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, DownloadIcon, FilterIcon } from "lucide-react"

// Mock data for usage history
const usageHistoryMock = [
  {
    id: "1",
    date: "2023-03-14T15:32:45Z",
    service: "GPT-4",
    type: "llm",
    usage: 12500,
    unit: "tokens",
    cost: 0.25,
  },
  {
    id: "2",
    date: "2023-03-14T14:18:22Z",
    service: "ElevenLabs",
    type: "voice",
    usage: 45,
    unit: "seconds",
    cost: 0.09,
  },
  {
    id: "3",
    date: "2023-03-14T12:05:11Z",
    service: "GPT-4",
    type: "llm",
    usage: 8700,
    unit: "tokens",
    cost: 0.17,
  },
  {
    id: "4",
    date: "2023-03-13T22:45:33Z",
    service: "ElevenLabs",
    type: "voice",
    usage: 32,
    unit: "seconds",
    cost: 0.06,
  },
  {
    id: "5",
    date: "2023-03-13T18:12:09Z",
    service: "GPT-4",
    type: "llm",
    usage: 15200,
    unit: "tokens",
    cost: 0.3,
  },
  {
    id: "6",
    date: "2023-03-13T16:34:27Z",
    service: "ElevenLabs",
    type: "voice",
    usage: 78,
    unit: "seconds",
    cost: 0.16,
  },
  {
    id: "7",
    date: "2023-03-13T14:22:51Z",
    service: "GPT-4",
    type: "llm",
    usage: 9300,
    unit: "tokens",
    cost: 0.19,
  },
]

export function UsageTable() {
  const [filter, setFilter] = useState<string | null>(null)

  const filteredData = filter ? usageHistoryMock.filter((item) => item.type === filter) : usageHistoryMock

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <FilterIcon className="h-3.5 w-3.5" />
              <span>Filter</span>
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilter(null)}>All Services</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("llm")}>LLM Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("voice")}>Voice Only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="h-8 gap-1">
          <DownloadIcon className="h-3.5 w-3.5" />
          <span>Export</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{new Date(item.date).toLocaleString()}</TableCell>
                <TableCell>{item.service}</TableCell>
                <TableCell>
                  {item.usage.toLocaleString()} {item.unit}
                </TableCell>
                <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

