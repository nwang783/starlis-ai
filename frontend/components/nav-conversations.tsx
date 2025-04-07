"use client"

import {
  ArrowUpRight,
  MessageCircle,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  PencilIcon,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { getUserConversations, deleteConversation, updateConversationName } from "@/lib/firebase/conversations"

export function NavConversations() {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<{ name: string; id?: string } | null>(null)
  const [newName, setNewName] = useState("")
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

    // Listen for conversation rename events
    const handleConversationRenamed = async () => {
      if (!user) return
      try {
        const userConversations = await getUserConversations(user.uid)
        setConversations(userConversations)
      } catch (error) {
        console.error("Error refreshing conversations:", error)
      }
    }

    // Listen for new conversation events
    const handleConversationCreated = async () => {
      if (!user) return
      try {
        const userConversations = await getUserConversations(user.uid)
        setConversations(userConversations)
      } catch (error) {
        console.error("Error refreshing conversations:", error)
      }
    }

    window.addEventListener('conversationRenamed', handleConversationRenamed)
    window.addEventListener('conversationCreated', handleConversationCreated)
    return () => {
      window.removeEventListener('conversationRenamed', handleConversationRenamed)
      window.removeEventListener('conversationCreated', handleConversationCreated)
    }
  }, [user])

  const handleRename = async () => {
    if (!selectedConversation?.id || !user) return

    try {
      await updateConversationName(user.uid, selectedConversation.id, newName)
      // Refresh conversations list
      const updatedConversations = await getUserConversations(user.uid)
      setConversations(updatedConversations)
      setRenameDialogOpen(false)
      setNewName("")
    } catch (error) {
      console.error("Error renaming conversation:", error)
    }
  }

  const handleDelete = async () => {
    if (!selectedConversation?.id || !user) return

    try {
      await deleteConversation(user.uid, selectedConversation.id)
      // Refresh conversations list
      const updatedConversations = await getUserConversations(user.uid)
      setConversations(updatedConversations)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const openRenameDialog = (conversation: { name: string; id?: string }) => {
    setSelectedConversation(conversation)
    setNewName(conversation.name)
    setRenameDialogOpen(true)
  }

  const openDeleteDialog = (conversation: { name: string; id?: string }) => {
    setSelectedConversation(conversation)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="New Conversation"
              className={cn(
                "group relative w-full transition-colors duration-200 ease-in-out",
                "hover:bg-accent/50",
                "dark:hover:bg-accent/50",
                "z-50"
              )}
            >
              <a 
                href="/assistant"
                className={cn(
                  "flex items-center gap-3 px-3 py-4 text-sm font-medium",
                  "transition-colors duration-200 ease-in-out",
                  "text-muted-foreground hover:text-foreground",
                  "dark:text-muted-foreground dark:hover:text-foreground",
                  "relative z-50"
                )}
              >
                <PlusCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>New conversation</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden pt-0">
        <div className="flex items-center justify-between px-2">
          <SidebarGroupLabel className="p-0">Conversations</SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
            onClick={() => (window.location.href = "/conversations")}
          >
            View all
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <SidebarMenu>
          {isLoading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading conversations...</div>
          ) : conversations.length > 0 ? (
            conversations.slice(0, 6).map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <div 
                  className="flex items-center w-full"
                  onMouseEnter={() => setHoveredItem(conversation.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "group relative w-full transition-colors duration-200 ease-in-out",
                      "hover:bg-accent/50",
                      "dark:hover:bg-accent/50",
                      "z-50",
                      hoveredItem === conversation.id && "bg-accent/50 dark:bg-accent/50"
                    )}
                  >
                    <a
                      href={`/assistant?chat=${conversation.id}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium",
                        "transition-colors duration-200 ease-in-out",
                        "text-muted-foreground hover:text-foreground",
                        "dark:text-muted-foreground dark:hover:text-foreground",
                        "relative z-50",
                        hoveredItem === conversation.id && "text-foreground dark:text-foreground"
                      )}
                    >
                      <MessageCircle className="h-4 w-4 flex-shrink-0" />
                      <div className="relative ml-2 w-full max-w-[180px] overflow-hidden">
                        <span className="block whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground 99.5% to-transparent [background-size:101%_100%]">{conversation.name}</span>
                      </div>
                      <div className={cn(
                        "flex-shrink-0 transition-opacity duration-200",
                        hoveredItem === conversation.id ? "opacity-100" : "opacity-0"
                      )}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 px-0 my-1"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-48 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                          >
                            <DropdownMenuItem onSelect={() => openRenameDialog(conversation)}>
                              <PencilIcon className="text-muted-foreground" />
                              <span>Rename Conversation</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => openDeleteDialog(conversation)}>
                              <Trash2 className="text-red-500" />
                              <span className="text-red-500">Delete Conversation</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No conversations yet</div>
          )}
        </SidebarMenu>
      </SidebarGroup>

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
    </>
  )
}

