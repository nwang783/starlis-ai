"use client"

import { Progress } from "@/components/ui/progress"

// Mock data for usage quotas
const quotasMock = [
  {
    id: "llm",
    name: "LLM Tokens",
    used: 2_134_567,
    limit: 5_000_000,
    unit: "tokens",
  },
  {
    id: "voice",
    name: "Voice Synthesis",
    used: 4_321,
    limit: 10_000,
    unit: "seconds",
  },
]

export function UsageQuota() {
  return (
    <div className="space-y-6">
      {quotasMock.map((quota) => {
        const percentage = Math.min(100, Math.round((quota.used / quota.limit) * 100))
        const remaining = quota.limit - quota.used

        return (
          <div key={quota.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{quota.name}</p>
                <p className="text-sm text-muted-foreground">
                  {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} {quota.unit}
                </p>
              </div>
              <div className="text-sm font-medium">{percentage}%</div>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {remaining.toLocaleString()} {quota.unit} remaining in current billing period
            </p>
          </div>
        )
      })}
    </div>
  )
}

