"use client"

import {
  ArrowUpRight,
  MessageSquare,
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
import { useState } from "react"
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

export function NavConversations({
  projects,
}: {
  projects: {
    name: string
    url?: string
    id?: string
    icon?: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<{ name: string; id?: string } | null>(null)
  const [newName, setNewName] = useState("")

  const handleRename = () => {
    // Here you would implement the actual rename functionality
    // For example, update the conversation name in your database
    console.log(`Renaming conversation ${selectedConversation?.id} to ${newName}`)

    // Close the dialog
    setRenameDialogOpen(false)
    setNewName("")
  }

  const handleDelete = () => {
    // Here you would implement the actual delete functionality
    // For example, delete the conversation from your database
    console.log(`Deleting conversation ${selectedConversation?.id}`)

    // Close the dialog
    setDeleteDialogOpen(false)
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
      <Button
        variant="outline"
        className="mb-4 w-full justify-start rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => (window.location.href = "/assistant")}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New chat
      </Button>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between px-2 py-1.5">
          <SidebarGroupLabel className="p-0">Conversations</SidebarGroupLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/conversations")}
          >
            View all
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                className="flex items-center"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <a
                  href={item.url || `/assistant?chat=${item.id || Math.random().toString(36).substring(2, 9)}`}
                  className="flex w-full items-center"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="relative ml-2 w-full max-w-[180px] overflow-hidden">
                    <span className="block whitespace-nowrap">{item.name}</span>
                    <div
                      className={`absolute inset-y-0 right-0 w-[100px] bg-gradient-to-r from-transparent ${
                        hoveredItem === item.name ? "to-muted" : "to-zinc-950 dark:to-zinc-900"
                      }`}
                    ></div>
                  </div>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onSelect={() => openRenameDialog(item)}>
                    <PencilIcon className="text-muted-foreground" />
                    <span>Rename Conversation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => openDeleteDialog(item)}>
                    <Trash2 className="text-red-500" />
                    <span className="text-red-500">Delete Conversation</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          {projects.length === 0 && (
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

