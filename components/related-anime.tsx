"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { getRelatedAnime } from "@/lib/firebase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface Anime {
  id: string
  title: string
  image: string
}

interface RelatedAnimeProps {
  animeId: string
}

export function RelatedAnime({ animeId }: RelatedAnimeProps) {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const related = await getRelatedAnime(animeId)
        setAnimeList(related)
      } catch (error) {
        console.error("Error fetching related anime:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [animeId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-20 w-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (animeList.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Related Anime</h2>
      <div className="space-y-3">
        {animeList.map((anime) => (
          <Link key={anime.id} href={`/anime/${anime.id}`} className="flex gap-3 group">
            <div className="relative h-20 w-14 rounded-md overflow-hidden">
              <Image
                src={anime.image || "/placeholder.svg"}
                alt={anime.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{anime.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
