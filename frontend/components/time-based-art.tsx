"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { StarsBackground } from "@/components/ui/stars-background"

export function TimeBasedArt() {
  const [scrollY, setScrollY] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState<"sunrise" | "day" | "sunset" | "night">("day")
  const [opacity, setOpacity] = useState(1)

  // Determine time of day
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 8) {
        setTimeOfDay("sunrise")
      } else if (hour >= 8 && hour < 17) {
        setTimeOfDay("day")
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay("sunset")
      } else {
        setTimeOfDay("night")
      }
    }

    updateTimeOfDay()
    const interval = setInterval(updateTimeOfDay, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Handle scroll for fade effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)

      // Fade out as user scrolls down
      const maxScroll = 300 // Increased fade out threshold
      const newOpacity = Math.max(0, 1 - currentScrollY / maxScroll)
      setOpacity(newOpacity)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-96 z-0 transition-opacity duration-300", // Changed from absolute to fixed
        timeOfDay === "sunrise" && "bg-gradient-to-b from-orange-300 via-amber-200 to-transparent",
        timeOfDay === "day" && "bg-gradient-to-b from-sky-300 via-amber-100 to-transparent",
        timeOfDay === "sunset" && "bg-gradient-to-b from-rose-400 via-orange-300 to-transparent",
        timeOfDay === "night" && "bg-gradient-to-b from-indigo-900 via-blue-800 to-transparent",
      )}
      style={{ opacity }}
    >
      {timeOfDay === "night" && (
        <>
          <StarsBackground
            starDensity={0.0003} // Increased star density
            allStarsTwinkle={true}
            twinkleProbability={0.8}
            minTwinkleSpeed={0.3}
            maxTwinkleSpeed={1.2}
          />
          <ShootingStars
            minSpeed={15}
            maxSpeed={35}
            minDelay={1000} // Decreased delay to show more shooting stars
            maxDelay={3000} // Decreased max delay
            starColor="#ffffff"
            trailColor="#8ab4f8"
            starWidth={12}
            starHeight={1.5}
          />
        </>
      )}
    </div>
  )
}

