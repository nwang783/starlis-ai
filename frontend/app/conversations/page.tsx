"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { MessageSquare, Search, PencilIcon, Trash2, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { createPortal } from "react-dom"
import { toast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getUserConversations, deleteConversation } from "@/lib/firebase/conversations"

function ActionsCell({ conversation, onRename, onDelete }: { 
  conversation: any, 
  onRename: (conversation: any, e: React.MouseEvent) => void,
  onDelete: (conversation: any, e: React.MouseEvent) => void
}) {
  return (
    <TableCell>
      <div className="flex justify-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onRename(conversation, e)
          }}
        >
          <PencilIcon className="h-4 w-4" />
          <span className="sr-only">Rename</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(conversation, e)
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </TableCell>
  )
}

export default function ConversationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newName, setNewName] = useState("")
  const [sortColumn, setSortColumn] = useState<string>("timeLastModified")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return
      try {
        const userConversations = await getUserConversations(user.uid)
        setConversations(userConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [user])

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort conversations
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a]
    const bValue = b[sortColumn as keyof typeof b]

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc" ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const handleRename = () => {
    // In a real app, you would update the conversation in your database
    console.log(`Renaming conversation ${selectedConversation?.id} to ${newName}`)
    setRenameDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedConversation?.id || !user) return

    try {
      await deleteConversation(user.uid, selectedConversation.id)
      // Refresh conversations list
      const updatedConversations = await getUserConversations(user.uid)
      setConversations(updatedConversations)
      setDeleteDialogOpen(false)
      toast({
        title: "Success",
        description: "Conversation deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openRenameDialog = (conversation: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedConversation(conversation)
    setNewName(conversation.name)
    setRenameDialogOpen(true)
  }

  const openDeleteDialog = (conversation: any) => {
    setSelectedConversation(conversation)
    setDeleteDialogOpen(true)
  }

  const navigateToConversation = (id: string) => {
    router.push(`/assistant?chat=${id}`)
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between mb-6 w-full">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <Button onClick={() => router.push("/assistant")}>New Conversation</Button>
        </div>

        <div className="relative mb-6 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full overflow-hidden rounded-md border">
          <div className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">Name {getSortIcon("name")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("timeLastModified")}>
                    <div className="flex items-center">Last Modified {getSortIcon("timeLastModified")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("timeCreated")}>
                    <div className="flex items-center">Created {getSortIcon("timeCreated")}</div>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p>Loading conversations...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mb-2" />
                        <p>No conversations found</p>
                        <p className="text-sm">
                          {searchQuery ? "Try a different search term" : "Start a new conversation to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedConversations.map((conversation) => (
                    <TableRow
                      key={conversation.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => navigateToConversation(conversation.id)}
                        >
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                            {conversation.name}
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {format(conversation.timeLastModified?.toDate() || new Date(), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        {format(conversation.timeCreated?.toDate() || new Date(), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <ActionsCell 
                        conversation={conversation}
                        onRename={openRenameDialog}
                        onDelete={openDeleteDialog}
                      />
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
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
              Are you sure you want to delete this conversation? All data in this conversation will be permanently lost.
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

