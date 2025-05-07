"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-hooks"
import { getEpisodeDetails } from "@/lib/anime-service"

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
        // Create an array to store episodes
        const episodeList = [];
        
        // Determine the number of episodes to fetch
        // Start with a reasonable number and then try to fetch each episode
        const estimatedEpisodeCount = 24;
        
        for (let i = 1; i <= estimatedEpisodeCount; i++) {
          try {
            const episode = await getEpisodeDetails(animeId, i);
            if (episode) {
              episodeList.push({
                id: episode.id,
                animeId: animeId,
                episodeNumber: episode.episodeNumber,
                title: episode.title || `Episode ${episode.episodeNumber}`,
                thumbnail: episode.thumbnail || "/placeholder.svg",
                releaseDate: episode.releaseDate || new Date().toISOString()
              });
            } else {
              // If we can't find an episode, we might have reached the end
              // Break after 3 consecutive missing episodes
              if (i > 1 && i > episodeList.length + 3) {
                break;
              }
            }
          } catch (episodeError) {
            console.error(`Error fetching episode ${i}:`, episodeError);
            // Continue trying other episodes
          }
        }
        
        if (episodeList.length > 0) {
          setEpisodes(episodeList);
        } else {
          // If no episodes found, create dummy episodes
          const dummyEpisodes = Array.from({ length: 12 }, (_, i) => ({
            id: `${animeId}-${i + 1}`,
            animeId: animeId,
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`,
            thumbnail: "/placeholder.svg",
            releaseDate: new Date().toISOString()
          }));
          
          setEpisodes(dummyEpisodes);
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
        // Create fallback episodes
        const fallbackEpisodes = Array.from({ length: 12 }, (_, i) => ({
          id: `${animeId}-${i + 1}`,
          animeId: animeId,
          episodeNumber: i + 1,
          title: `Episode ${i + 1}`,
          thumbnail: "/placeholder.svg",
          releaseDate: new Date().toISOString()
        }));
        
        setEpisodes(fallbackEpisodes);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [animeId])

  // We're no longer using Firebase for watch history
  // This could be replaced with local storage or another solution
  useEffect(() => {
    if (user) {
      try {
        // Try to get watch history from localStorage
        const historyKey = `watchHistory-${user.uid}-${animeId}`;
        const storedHistory = localStorage.getItem(historyKey);
        
        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          setWatchedEpisodes(history);
        }
      } catch (error) {
        console.error("Error fetching watch history:", error);
      }
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
