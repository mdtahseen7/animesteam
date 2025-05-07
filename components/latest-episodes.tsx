"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Play } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchLatestEpisodes } from "@/lib/scrapers/anime-scraper"

interface Episode {
  id: string
  animeId: string
  animeTitle: string
  episodeNumber: number
  thumbnail: string
  releaseDate: string
}

export function LatestEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        // Try to get cached data first
        const cached = localStorage.getItem('latestEpisodes')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          // Use cache if it's less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setEpisodes(data)
            setLoading(false)
            return
          }
        }

        // Fetch fresh data with retry logic
        let attempts = 0
        let success = false
        while (attempts < 3 && !success) {
          try {
            const latestEpisodes = await fetchLatestEpisodes()
            if (latestEpisodes && latestEpisodes.length > 0) {
              setEpisodes(latestEpisodes)
              // Cache the successful response
              localStorage.setItem('latestEpisodes', JSON.stringify({
                data: latestEpisodes,
                timestamp: Date.now()
              }))
              success = true
            } else {
              throw new Error('No episodes found')
            }
          } catch (e) {
            attempts++
            if (attempts === 3) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      } catch (error) {
        console.error("Error fetching latest episodes:", error)
        setError("Failed to load episodes. Please try again later.")
        // Try to use cached data even if it's old
        const cached = localStorage.getItem('latestEpisodes')
        if (cached) {
          const { data } = JSON.parse(cached)
          setEpisodes(data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchEpisodes()
  }, [])

  if (loading) {
    return <LatestEpisodesSkeleton />
  }

  if (error && episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Latest Episodes</h2>
        <Link href="/latest">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {episodes.map((episode) => (
          <Link key={episode.id} href={`/watch/${episode.animeId}/${episode.episodeNumber}`} className="anime-card">
            <Card className="overflow-hidden border-border/50 bg-card/30 hover:bg-card/60 transition-colors">
              <div className="relative aspect-video">
                <Image
                  src={episode.thumbnail || "/placeholder.svg"}
                  alt={`${episode.animeTitle} Episode ${episode.episodeNumber}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <Badge className="bg-primary hover:bg-primary">Episode {episode.episodeNumber}</Badge>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button size="icon" className="rounded-full bg-primary/90 hover:bg-primary">
                    <Play className="h-5 w-5 fill-white" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium line-clamp-1">{episode.animeTitle}</h3>
                <p className="text-xs text-muted-foreground">{new Date(episode.releaseDate).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function LatestEpisodesSkeleton() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[120px] w-full rounded-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
      </div>
    </section>
  )
}
