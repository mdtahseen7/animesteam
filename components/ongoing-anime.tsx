"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchOngoingAnime } from "@/lib/scrapers/anime-scraper"

interface Anime {
  id: string
  title: string
  image: string
  episodeCount: number
  genres: string[]
}

export function OngoingAnime() {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        // Try to get cached data first
        const cached = localStorage.getItem('ongoingAnime')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          // Use cache if it's less than 30 minutes old since ongoing anime updates less frequently
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setAnimeList(data)
            setLoading(false)
            return
          }
        }

        // Fetch fresh data with retry logic
        let attempts = 0
        let success = false
        while (attempts < 3 && !success) {
          try {
            const ongoingAnime = await fetchOngoingAnime()
            if (ongoingAnime && ongoingAnime.length > 0) {
              setAnimeList(ongoingAnime)
              // Cache the successful response
              localStorage.setItem('ongoingAnime', JSON.stringify({
                data: ongoingAnime,
                timestamp: Date.now()
              }))
              success = true
            } else {
              throw new Error('No ongoing anime found')
            }
          } catch (e) {
            attempts++
            if (attempts === 3) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      } catch (error) {
        console.error("Error fetching ongoing anime:", error)
        setError("Failed to load ongoing anime. Please try again later.")
        // Try to use cached data even if it's old
        const cached = localStorage.getItem('ongoingAnime')
        if (cached) {
          const { data } = JSON.parse(cached)
          setAnimeList(data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAnime()
  }, [])

  if (loading) {
    return <OngoingAnimeSkeleton />
  }

  if (error && animeList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Ongoing Anime</h2>
        <Link href="/ongoing">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {animeList.map((anime) => (
          <Link key={anime.id} href={`/anime/${anime.id}`} className="anime-card">
            <Card className="overflow-hidden border-border/50 bg-card/30 hover:bg-card/60 transition-colors">
              <div className="relative aspect-[2/3]">
                <Image src={anime.image || "/placeholder.svg"} alt={anime.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <Badge variant="outline" className="border-primary text-primary">
                    {anime.episodeCount} Episodes
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium line-clamp-1">{anime.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{anime.genres.slice(0, 3).join(", ")}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function OngoingAnimeSkeleton() {
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
              <Skeleton className="h-[250px] w-full rounded-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
      </div>
    </section>
  )
}
