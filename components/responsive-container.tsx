import type React from "react"
import type { ReactNode } from "react"

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children, className = "" }) => {
  return <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto ${className}`}>{children}</div>
}

export default ResponsiveContainer

