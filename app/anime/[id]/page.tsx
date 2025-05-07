import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AnimeDetails } from "@/components/anime-details"
import { EpisodeList } from "@/components/episode-list"
import { RelatedAnime } from "@/components/related-anime"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnimeById } from "@/lib/firebase/server"

interface AnimePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: AnimePageProps): Promise<Metadata> {
  try {
    const anime = await getAnimeById(params.id)

    if (!anime) {
      return {
        title: "Anime Not Found | AnimeStream",
      }
    }

    return {
      title: `${anime.title} | AnimeStream`,
      description: anime.description,
      openGraph: {
        images: [{ url: anime.image }],
      },
    }
  } catch (error) {
    return {
      title: "Anime | AnimeStream",
    }
  }
}

export default async function AnimePage({ params }: AnimePageProps) {
  try {
    const anime = await getAnimeById(params.id)

    if (!anime) {
      notFound()
    }

    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-1">
          <Suspense fallback={<AnimeDetailsSkeleton />}>
            <AnimeDetails anime={anime} />
          </Suspense>

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2">
              <Suspense fallback={<EpisodeListSkeleton />}>
                <EpisodeList animeId={params.id} />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={<RelatedAnimeSkeleton />}>
                <RelatedAnime animeId={params.id} />
              </Suspense>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  } catch (error) {
    notFound()
  }
}

function AnimeDetailsSkeleton() {
  return (
    <div className="relative">
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <div className="mt-4 flex gap-6">
        <Skeleton className="h-[200px] w-[150px] rounded-md" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}

function EpisodeListSkeleton() {
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

function RelatedAnimeSkeleton() {
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
