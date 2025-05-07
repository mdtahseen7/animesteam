"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchTrendingAnime } from "@/lib/scrapers/anime-scraper"

interface Anime {
  id: string
  title: string
  image: string
  rating: number
  genres: string[]
}

export function TrendingAnime() {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        // Try to get cached data first
        const cached = localStorage.getItem('trendingAnime')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          // Use cache if it's less than 15 minutes old
          if (Date.now() - timestamp < 15 * 60 * 1000) {
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
            const trendingAnime = await fetchTrendingAnime()
            if (trendingAnime && trendingAnime.length > 0) {
              setAnimeList(trendingAnime)
              // Cache the successful response
              localStorage.setItem('trendingAnime', JSON.stringify({
                data: trendingAnime,
                timestamp: Date.now()
              }))
              success = true
            } else {
              throw new Error('No trending anime found')
            }
          } catch (e) {
            attempts++
            if (attempts === 3) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      } catch (error) {
        console.error("Error fetching trending anime:", error)
        setError("Failed to load trending anime. Please try again later.")
        // Try to use cached data even if it's old
        const cached = localStorage.getItem('trendingAnime')
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
    return <TrendingAnimeSkeleton />
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
        <h2 className="text-2xl font-bold">Popular & Trending</h2>
        <Link href="/trending">
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
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/90 hover:bg-primary flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {anime.rating.toFixed(1)}
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

function TrendingAnimeSkeleton() {
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
