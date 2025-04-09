"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2, List, ArrowLeft, Check, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ChatHeaderProps {
  conversationId: string
  initialTitle: string
  onDelete: () => Promise<void>
  onRename: (newTitle: string) => Promise<void>
}

export function ChatHeader({ conversationId, initialTitle, onDelete, onRename }: ChatHeaderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState(initialTitle)
  const [currentTitle, setCurrentTitle] = useState(initialTitle)

  useEffect(() => {
    setCurrentTitle(initialTitle)
  }, [initialTitle])

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== currentTitle) {
      await onRename(newTitle.trim())
      setCurrentTitle(newTitle.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const previousPath = document.referrer
            if (previousPath.includes('/conversations')) {
              router.push('/conversations')
            } else {
              router.push('/assistant')
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Title and Menu - Left aligned on desktop, centered on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <div className="text-lg font-semibold">
            {currentTitle}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault()
                    setIsEditing(true)
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename conversation</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter conversation name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRename()
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRename}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile layout - Centered title and right-aligned menu */}
      <div className="md:hidden flex-1 flex items-center justify-between">
        <div className="flex-1 text-center">
          <div className="text-lg font-semibold">
            {currentTitle}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => {
                    e.preventDefault()
                    setIsEditing(true)
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename conversation</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter conversation name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRename()
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRename}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop sidebar button */}
      <div className="hidden md:block">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 