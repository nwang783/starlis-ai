"use client"

import { useState } from "react"
import { MessageSquare, PencilIcon, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// This would come from your database in a real app
const mockConversations = [
  { id: "conv1", name: "Meeting with client", lastUpdated: "2 hours ago", messageCount: 24 },
  { id: "conv2", name: "Project planning", lastUpdated: "Yesterday", messageCount: 56 },
  { id: "conv3", name: "Weekly standup", lastUpdated: "3 days ago", messageCount: 18 },
  { id: "conv4", name: "Product roadmap", lastUpdated: "1 week ago", messageCount: 42 },
  { id: "conv5", name: "Customer feedback", lastUpdated: "2 weeks ago", messageCount: 31 },
]

export default function ConversationsPage() {
  const [conversations, setConversations] = useState(mockConversations)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newName, setNewName] = useState("")

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRename = () => {
    // In a real app, you would update the conversation in your database
    setConversations(
      conversations.map((conv) => (conv.id === selectedConversation?.id ? { ...conv, name: newName } : conv)),
    )
    setRenameDialogOpen(false)
  }

  const handleDelete = () => {
    // In a real app, you would delete the conversation from your database
    setConversations(conversations.filter((conv) => conv.id !== selectedConversation?.id))
    setDeleteDialogOpen(false)
  }

  const openRenameDialog = (conversation: any) => {
    setSelectedConversation(conversation)
    setNewName(conversation.name)
    setRenameDialogOpen(true)
  }

  const openDeleteDialog = (conversation: any) => {
    setSelectedConversation(conversation)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All Conversations</h1>
        <Button onClick={() => (window.location.href = "/assistant")}>New Conversation</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">{conversation.name}</CardTitle>
                <CardDescription>Last updated: {conversation.lastUpdated}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  <span>{conversation.messageCount} messages</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-3 bg-muted/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = `/assistant?chat=${conversation.id}`)}
                >
                  Open
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openRenameDialog(conversation)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => openDeleteDialog(conversation)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">No conversations found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Start a new conversation to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>Enter a new name for this conversation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={selectedConversation?.name}
                className="w-full"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? All history will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

