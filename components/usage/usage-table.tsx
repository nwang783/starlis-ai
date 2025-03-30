"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, DownloadIcon, FilterIcon } from "lucide-react"

// Mock data for usage table
const mockData = [
  {
    id: "1",
    date: "2024-03-14T15:32:45Z",
    type: "llm",
    description: "Chat conversation",
    unit: "tokens",
    amount: 1250,
  },
  {
    id: "2",
    date: "2024-03-14T14:18:22Z",
    type: "voice",
    description: "Voice synthesis",
    unit: "seconds",
    amount: 45,
  },
  {
    id: "3",
    date: "2024-03-14T12:05:11Z",
    type: "llm",
    description: "Email composition",
    unit: "tokens",
    amount: 850,
  },
  {
    id: "4",
    date: "2024-03-13T22:45:33Z",
    type: "llm",
    description: "Chat conversation",
    unit: "tokens",
    amount: 1100,
  },
  {
    id: "5",
    date: "2024-03-13T18:12:09Z",
    type: "voice",
    description: "Voice synthesis",
    unit: "seconds",
    amount: 30,
  },
  {
    id: "6",
    date: "2024-03-13T16:34:27Z",
    type: "llm",
    description: "Email composition",
    unit: "tokens",
    amount: 920,
  },
  {
    id: "7",
    date: "2024-03-13T14:22:51Z",
    type: "llm",
    description: "Chat conversation",
    unit: "tokens",
    amount: 750,
  },
]

export function UsageTable() {
  const [filter, setFilter] = useState<string | null>(null)

  const filteredData = filter ? mockData.filter((item) => item.type === filter) : mockData

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
                <TableCell>{item.type === "llm" ? "GPT-4" : "ElevenLabs"}</TableCell>
                <TableCell>
                  {item.amount.toLocaleString()} {item.unit}
                </TableCell>
                <TableCell className="text-right">${(item.amount * 0.0002).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

