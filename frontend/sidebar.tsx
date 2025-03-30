import type React from "react"

interface SidebarProps {
  children: React.ReactNode
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 bg-gray-50">
      {children}
    </div>
  )
}

interface SidebarInsetProps {
  children: React.ReactNode
}

const SidebarInset: React.FC<SidebarInsetProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-0 flex-1">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 overflow-x-hidden">{children}</div>
      </div>
    </div>
  )
}

export { Sidebar, SidebarInset }

