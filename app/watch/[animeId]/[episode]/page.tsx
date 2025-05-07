import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { VideoPlayer } from "@/components/video-player"
import { EpisodeNavigation } from "@/components/episode-navigation"
import { Comments } from "@/components/comments"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnimeById, getEpisodeByNumber } from "@/lib/firebase/server"

interface WatchPageProps {
  params: {
    animeId: string
    episode: string
  }
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  try {
    const anime = await getAnimeById(params.animeId)
    const episodeNumber = Number.parseInt(params.episode)

    if (!anime) {
      return {
        title: "Episode Not Found | AnimeStream",
      }
    }

    return {
      title: `${anime.title} Episode ${episodeNumber} | AnimeStream`,
      description: `Watch ${anime.title} Episode ${episodeNumber} online for free in HD quality.`,
    }
  } catch (error) {
    return {
      title: "Watch Anime | AnimeStream",
    }
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  try {
    const episodeNumber = Number.parseInt(params.episode)
    const anime = await getAnimeById(params.animeId)
    const episode = await getEpisodeByNumber(params.animeId, episodeNumber)

    if (!anime || !episode) {
      notFound()
    }

    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1">
          <h1 className="text-2xl font-bold mb-4">
            {anime.title} - Episode {episodeNumber}
            {episode.title && ` - ${episode.title}`}
          </h1>

          <Suspense fallback={<VideoPlayerSkeleton />}>
            <VideoPlayer
              animeId={params.animeId}
              episodeId={episode.id}
              episodeNumber={episodeNumber}
              streamUrl={episode.streamUrl}
            />
          </Suspense>

          <Suspense fallback={<EpisodeNavigationSkeleton />}>
            <EpisodeNavigation
              animeId={params.animeId}
              currentEpisode={episodeNumber}
              totalEpisodes={anime.episodeCount}
            />
          </Suspense>

          <div className="mt-8">
            <Suspense fallback={<CommentsSkeleton />}>
              <Comments animeId={params.animeId} episodeId={episode.id} />
            </Suspense>
          </div>
        </div>
        <Footer />
      </main>
    )
  } catch (error) {
    notFound()
  }
}

function VideoPlayerSkeleton() {
  return (
    <div className="w-full aspect-video bg-card/30 rounded-lg mb-6">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  )
}

function EpisodeNavigationSkeleton() {
  return (
    <div className="flex justify-between mt-4">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="h-10 w-28" />
    </div>
  )
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-4 mt-6">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
      </div>
    </div>
  )
}
