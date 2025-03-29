"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Mail, Sparkles } from "lucide-react"

export function HeroScreen() {
  const [activeScreen, setActiveScreen] = useState(0)

  const screens = [
    {
      title: "Arrange a meeting",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <Avatar className="mt-0.5 size-8 border">
              <AvatarFallback>STAR</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-4 py-3">
              Schedule a meeting with John about the project next week
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Avatar className="mt-0.5 size-8 border">
              <AvatarFallback>AI</AvatarFallback>
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
            </Avatar>
            <div className="bg-primary/10 rounded-lg px-4 py-3">
              <p>
                I'll schedule a meeting with John next week about the project. Let me check your availability and send
                an invitation.
              </p>
              <div className="mt-2 rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="font-medium">Arranging Meeting</span>
                  </div>
                  <span className="text-muted-foreground">1 min ago</span>
                </div>
                <p className="mt-2 text-sm">Meeting scheduled with John for Tuesday at 2:00 PM</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                  <Check className="size-3.5" />
                  <span>Added to calendar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Manage emails",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <Avatar className="mt-0.5 size-8 border">
              <AvatarFallback>STAR</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-4 py-3">Reply to Sarah's email about the proposal</div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Avatar className="mt-0.5 size-8 border">
              <AvatarFallback>AI</AvatarFallback>
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
            </Avatar>
            <div className="bg-primary/10 rounded-lg px-4 py-3">
              <p>I'll draft a response to Sarah about the proposal. Would you like to review it before I send it?</p>
              <div className="mt-2 rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary" />
                    <span className="font-medium">Email Draft</span>
                  </div>
                  <span className="text-muted-foreground">30 sec ago</span>
                </div>
                <p className="mt-2 text-sm">
                  Hi Sarah, Thank you for sending the proposal. We've reviewed it and have a few suggestions...
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Draft ready for review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[500px] space-y-4">
      <div className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur">
        <span className="inline-block size-2 rounded-full bg-emerald-500 mr-1"></span>
        Starlis
      </div>
      <Card className="overflow-hidden border bg-card shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {screens[activeScreen].content}
          </motion.div>
        </CardContent>
      </Card>
      <div className="flex justify-center space-x-2">
        {screens.map((screen, index) => (
          <button
            key={index}
            onClick={() => setActiveScreen(index)}
            className={`size-2 rounded-full ${activeScreen === index ? "bg-primary" : "bg-muted"}`}
            aria-label={`View ${screen.title}`}
          />
        ))}
      </div>
    </div>
  )
}

