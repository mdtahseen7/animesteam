"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { fetchTrendingAnime } from "@/lib/scrapers/anime-scraper"
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
        // Since we don't have a direct way to get related anime from scrapers,
        // we'll use trending anime as a substitute
        const trending = await fetchTrendingAnime(5);
        
        // Filter out the current anime if it's in the trending list
        const filtered = trending.filter((anime: any) => anime.id.toString() !== animeId);
        
        // Map to our Anime interface
        const relatedAnime = filtered.map((anime: any) => ({
          id: anime.id.toString(),
          title: anime.title,
          image: anime.image
        }));
        
        setAnimeList(relatedAnime);
      } catch (error) {
        console.error("Error fetching related anime:", error);
        // Create dummy related anime
        const dummyAnime = [
          { id: 'one-piece', title: 'One Piece', image: '/placeholder.svg' },
          { id: 'naruto', title: 'Naruto', image: '/placeholder.svg' },
          { id: 'attack-on-titan', title: 'Attack on Titan', image: '/placeholder.svg' },
          { id: 'demon-slayer', title: 'Demon Slayer', image: '/placeholder.svg' },
          { id: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', image: '/placeholder.svg' }
        ];
        setAnimeList(dummyAnime);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
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
