"use client"

import { useState, useEffect } from "react"

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQueryList = window.matchMedia(query)
    const listener = () => setMatches(mediaQueryList.matches)
    setMatches(mediaQueryList.matches)

    mediaQueryList.addEventListener("change", listener)
    return () => mediaQueryList.removeEventListener("change", listener)
  }, [query])

  // During SSR, always return false to avoid hydration mismatch
  if (!mounted) {
    return false
  }

  return matches
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)")
}

