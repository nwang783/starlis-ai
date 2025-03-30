"use client"

import { useEffect } from "react"

export function BillingToggle() {
  useEffect(() => {
    const monthlyBilling = document.getElementById("monthlyBilling")
    const yearlyBilling = document.getElementById("yearlyBilling")
    const html = document.documentElement

    if (monthlyBilling && yearlyBilling) {
      // Set initial state
      monthlyBilling.classList.add("bg-primary", "text-white")
      if (html.classList.contains("dark")) {
        monthlyBilling.classList.add("dark:text-black")
      }
      yearlyBilling.classList.remove("bg-primary", "text-white", "dark:text-black")
      document.querySelectorAll(".monthly-price").forEach((el) => el.classList.remove("hidden"))
      document.querySelectorAll(".yearly-price").forEach((el) => el.classList.add("hidden"))
    }
  }, [])

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="relative flex items-center p-1 bg-secondary/50 rounded-full">
        <button
          id="monthlyBilling"
          className="relative z-10 px-4 py-1.5 text-sm font-medium rounded-full bg-primary text-white dark:text-black transition-all"
          onClick={() => {
            const monthlyBilling = document.getElementById("monthlyBilling")
            const yearlyBilling = document.getElementById("yearlyBilling")
            if (monthlyBilling && yearlyBilling) {
              monthlyBilling.classList.add("bg-primary", "text-white", "dark:text-black")
              yearlyBilling.classList.remove("bg-primary", "text-white", "dark:text-black")
              document.querySelectorAll(".monthly-price").forEach((el) => el.classList.remove("hidden"))
              document.querySelectorAll(".yearly-price").forEach((el) => el.classList.add("hidden"))
            }
          }}
        >
          Monthly
        </button>
        <button
          id="yearlyBilling"
          className="relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-all"
          onClick={() => {
            const monthlyBilling = document.getElementById("monthlyBilling")
            const yearlyBilling = document.getElementById("yearlyBilling")
            if (monthlyBilling && yearlyBilling) {
              yearlyBilling.classList.add("bg-primary", "text-white", "dark:text-black")
              monthlyBilling.classList.remove("bg-primary", "text-white", "dark:text-black")
              document.querySelectorAll(".yearly-price").forEach((el) => el.classList.remove("hidden"))
              document.querySelectorAll(".monthly-price").forEach((el) => el.classList.add("hidden"))
            }
          }}
        >
          Yearly
        </button>
      </div>
      <div className="ml-3 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
        Save up to 16%
      </div>
    </div>
  )
} 