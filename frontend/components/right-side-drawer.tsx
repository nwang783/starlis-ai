import { useEffect } from "react"
import { X, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface RightSideDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function RightSideDrawer({ isOpen, onClose, children, title, className }: RightSideDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-[400px] bg-background z-[101] shadow-lg",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">{title}</h2>
              <div className="w-8" /> {/* Spacer for alignment */}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 