"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Plus, Star, Calendar, Clock, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-hooks"
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/lib/firebase/client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Anime {
  id: string
  title: string
  image: string
  banner: string
  description: string
  genres: string[]
  status: string
  releaseDate: string
  rating: number
  episodeCount: number
  duration: string
  studios: string[]
  trailer?: string
}

interface AnimeDetailsProps {
  anime: Anime
}

export function AnimeDetails({ anime }: AnimeDetailsProps) {
  const { user } = useAuth()
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const checkWatchlist = async () => {
        const isInWatchlist = await checkInWatchlist(user.uid, anime.id)
        setInWatchlist(isInWatchlist)
      }
      checkWatchlist()
    }
  }, [user, anime.id])

  const handleWatchlistToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add anime to your watchlist",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (inWatchlist) {
        await removeFromWatchlist(user.uid, anime.id)
        setInWatchlist(false)
        toast({
          title: "Removed from watchlist",
          description: `${anime.title} has been removed from your watchlist`,
        })
      } else {
        await addToWatchlist(user.uid, anime.id)
        setInWatchlist(true)
        toast({
          title: "Added to watchlist",
          description: `${anime.title} has been added to your watchlist`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden mb-6">
        <Image src={anime.banner || anime.image} alt={anime.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="shrink-0">
          <div className="relative w-[200px] aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
            <Image src={anime.image || "/placeholder.svg"} alt={anime.title} fill className="object-cover" priority />
          </div>
          <div className="mt-4 space-y-2">
            <Button className="w-full gap-2" asChild>
              <Link href={`/watch/${anime.id}/1`}>
                <Play className="h-4 w-4 fill-current" /> Watch Now
              </Link>
            </Button>
            <Button
              variant={inWatchlist ? "destructive" : "outline"}
              className="w-full gap-2"
              onClick={handleWatchlistToggle}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{anime.title}</h1>

          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary hover:bg-primary flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {anime.rating.toFixed(1)}
            </Badge>
            <Badge variant="outline">{anime.status}</Badge>
            <Badge variant="secondary">{anime.episodeCount} Episodes</Badge>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {anime.genres.map((genre) => (
              <Link key={genre} href={`/genre/${genre.toLowerCase()}`}>
                <Badge variant="outline" className="hover:bg-secondary transition-colors">
                  {genre}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Released: {anime.releaseDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: {anime.duration}</span>
            </div>
            {anime.studios.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                <Info className="h-4 w-4" />
                <span>Studios: {anime.studios.join(", ")}</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="synopsis" className="w-full">
            <TabsList>
              <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
              {anime.trailer && <TabsTrigger value="trailer">Trailer</TabsTrigger>}
            </TabsList>
            <TabsContent value="synopsis" className="text-muted-foreground">
              <p>{anime.description}</p>
            </TabsContent>
            {anime.trailer && (
              <TabsContent value="trailer">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={anime.trailer}
                    title={`${anime.title} Trailer`}
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
