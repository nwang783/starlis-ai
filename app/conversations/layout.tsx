import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conversations | Starlis",
  description: "View and manage all your conversations",
}

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex min-h-screen flex-col">{children}</div>
}

