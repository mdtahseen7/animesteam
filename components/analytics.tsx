"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { getAnalytics, logEvent } from "firebase/analytics"
import { getApp } from "firebase/app"

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      try {
        const app = getApp()
        const analytics = getAnalytics(app)

        logEvent(analytics, "page_view", {
          page_path: pathname,
          page_search: searchParams?.toString(),
          page_location: window.location.href,
        })
      } catch (error) {
        // Analytics not initialized or other error
        console.error("Analytics error:", error)
      }
    }
  }, [pathname, searchParams])

  return null
}
