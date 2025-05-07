"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEpisodesByAnimeId } from "@/lib/firebase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-hooks"
import { getUserWatchHistory } from "@/lib/firebase/client"

interface Episode {
  id: string
  animeId: string
  episodeNumber: number
  title: string
  thumbnail: string
  releaseDate: string
}

interface EpisodeListProps {
  animeId: string
}

export function EpisodeList({ animeId }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const episodeList = await getEpisodesByAnimeId(animeId)
        setEpisodes(episodeList)
      } catch (error) {
        console.error("Error fetching episodes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEpisodes()
  }, [animeId])

  useEffect(() => {
    if (user) {
      const fetchWatchHistory = async () => {
        try {
          const history = await getUserWatchHistory(user.uid, animeId)
          setWatchedEpisodes(history.map((h) => h.episodeNumber))
        } catch (error) {
          console.error("Error fetching watch history:", error)
        }
      }

      fetchWatchHistory()
    }
  }, [user, animeId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {Array(24)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
        </div>
      </div>
    )
  }

  // Group episodes by season if needed
  const hasMultipleSeasons = episodes.some((ep) => ep.title?.includes("Season"))

  if (!hasMultipleSeasons) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Episodes</h2>
        <div className="episode-grid">
          {episodes.map((episode) => (
            <Link key={episode.id} href={`/watch/${animeId}/${episode.episodeNumber}`}>
              <Button
                variant={watchedEpisodes.includes(episode.episodeNumber) ? "default" : "outline"}
                className="w-full h-10"
              >
                {episode.episodeNumber}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Handle multiple seasons
  const seasons = [
    ...new Set(
      episodes.map((ep) => {
        const match = ep.title?.match(/Season (\d+)/i)
        return match ? Number.parseInt(match[1]) : 1
      }),
    ),
  ].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Episodes</h2>
      <Tabs defaultValue={seasons[0].toString()}>
        <TabsList>
          {seasons.map((season) => (
            <TabsTrigger key={season} value={season.toString()}>
              Season {season}
            </TabsTrigger>
          ))}
        </TabsList>
        {seasons.map((season) => (
          <TabsContent key={season} value={season.toString()}>
            <div className="episode-grid">
              {episodes
                .filter((ep) => {
                  const match = ep.title?.match(/Season (\d+)/i)
                  return match ? Number.parseInt(match[1]) === season : season === 1
                })
                .map((episode) => (
                  <Link key={episode.id} href={`/watch/${animeId}/${episode.episodeNumber}`}>
                    <Button
                      variant={watchedEpisodes.includes(episode.episodeNumber) ? "default" : "outline"}
                      className="w-full h-10"
                    >
                      {episode.episodeNumber}
                    </Button>
                  </Link>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
