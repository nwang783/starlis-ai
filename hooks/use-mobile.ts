"use client"

import { useState, useEffect } from "react"

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQueryList = window.matchMedia(query)
    const listener = () => setMatches(mediaQueryList.matches)
    setMatches(mediaQueryList.matches)

    mediaQueryList.addEventListener("change", listener)
    return () => mediaQueryList.removeEventListener("change", listener)
  }, [query])

  return matches
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}

