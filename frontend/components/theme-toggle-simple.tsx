"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggleSimple() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    // Set dark mode as default on initial load
    if (typeof window !== "undefined") {
      const html = document.documentElement
      html.classList.add("dark")
      document.querySelector("html")?.setAttribute("data-theme", "dark")
    }
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const currentTheme = html.classList.contains("dark") ? "dark" : "light"

    setIsDarkMode(currentTheme !== "dark")

    if (currentTheme === "dark") {
      html.classList.remove("dark")
      document.querySelector("html")?.setAttribute("data-theme", "light")
    } else {
      html.classList.add("dark")
      document.querySelector("html")?.setAttribute("data-theme", "dark")
    }
  }

  return (
    <button
      className="inline-flex items-center justify-center rounded-md text-sm font-medium p-2 hover:bg-accent hover:text-accent-foreground"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

