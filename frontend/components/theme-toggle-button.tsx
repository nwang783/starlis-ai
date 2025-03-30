"use client"

import { Moon, Sun } from "lucide-react"

export function ThemeToggleButton() {
  return (
    <button
      className="theme-toggle inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 p-2 hover:bg-accent hover:text-accent-foreground"
      onClick={() => {
        const html = document.documentElement
        const currentTheme = html.classList.contains("dark") ? "dark" : "light"
        if (currentTheme === "dark") {
          html.classList.remove("dark")
          html.setAttribute("data-theme", "light")
        } else {
          html.classList.add("dark")
          html.setAttribute("data-theme", "dark")
        }
      }}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 