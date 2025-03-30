import type React from "react"
import type { ReactNode } from "react"
import Header from "./header"

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
    </div>
  )
}

export default AppLayout

