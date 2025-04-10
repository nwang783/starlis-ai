import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { X } from "lucide-react"

interface RightDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function RightDrawer({ isOpen, onClose, children, title, className }: RightDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-full w-[400px] right-0 top-0 fixed">
        <div className="flex items-center justify-between p-4 border-b">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose className="p-1 hover:bg-accent rounded-full transition-colors">
            <X className="h-5 w-5" />
          </DrawerClose>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
} 