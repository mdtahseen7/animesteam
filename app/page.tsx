import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LatestEpisodes } from "@/components/latest-episodes"
import { OngoingAnime } from "@/components/ongoing-anime"
import { TrendingAnime } from "@/components/trending-anime"
import { SearchBar } from "@/components/search-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <section className="py-12 flex flex-col items-center justify-center text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">What would you like to watch today?</h1>
          <div className="w-full max-w-2xl">
            <SearchBar />
          </div>
          <Button variant="outline" className="gap-2">
            <Shuffle className="h-4 w-4" />
            Watch Something Random
          </Button>
        </section>

        <Suspense fallback={<SectionSkeleton />}>
          <LatestEpisodes />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <OngoingAnime />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <TrendingAnime />
        </Suspense>
      </div>
      <Footer />
    </main>
  )
}

function SectionSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[250px] w-full rounded-md" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
      </div>
    </div>
  )
}
