"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TypewriterText } from "@/components/typewriter-text"
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

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== initialTitle) {
      await onRename(newTitle.trim())
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await onDelete()
    router.push("/assistant")
  }

  return (
    <div className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <TypewriterText
            text={initialTitle}
            speed={30}
            className="text-lg font-semibold"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleRename}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete conversation</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => router.push("/conversations")}
      >
        <List className="h-4 w-4" />
        All Conversations
      </Button>
    </div>
  )
} 