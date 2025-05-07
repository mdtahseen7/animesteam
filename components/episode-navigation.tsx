"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface EpisodeNavigationProps {
  animeId: string
  currentEpisode: number
  totalEpisodes: number
}

export function EpisodeNavigation({ animeId, currentEpisode, totalEpisodes }: EpisodeNavigationProps) {
  const hasPrevious = currentEpisode > 1
  const hasNext = currentEpisode < totalEpisodes

  return (
    <div className="flex justify-between mt-4">
      {hasPrevious ? (
        <Link href={`/watch/${animeId}/${currentEpisode - 1}`}>
          <Button variant="outline" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        </Link>
      ) : (
        <Button variant="outline" disabled className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      <Link href={`/anime/${animeId}`}>
        <Button variant="outline">All Episodes</Button>
      </Link>

      {hasNext ? (
        <Link href={`/watch/${animeId}/${currentEpisode + 1}`}>
          <Button variant="outline" className="gap-1">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" disabled className="gap-1">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
