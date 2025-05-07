"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Plus, Star, Calendar, Clock, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-hooks"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ShareButton } from "@/components/share-button"

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

// Custom component to safely render HTML content
function SanitizedHTML({ html, className }: { html: string, className?: string }) {
  // Basic sanitization to allow only specific tags
  const sanitizeHTML = (html: string) => {
    // Convert HTML entities to prevent XSS
    const escapeHTML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // First escape all HTML
    let sanitized = escapeHTML(html);
    
    // Then selectively replace allowed tags
    // Replace <i> tags
    sanitized = sanitized.replace(/&lt;i&gt;/g, '<i>').replace(/&lt;\/i&gt;/g, '</i>');
    // Replace <em> tags
    sanitized = sanitized.replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>');
    // Replace <b> tags
    sanitized = sanitized.replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
    // Replace <strong> tags
    sanitized = sanitized.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
    // Replace <br> tags
    sanitized = sanitized.replace(/&lt;br&gt;/g, '<br>').replace(/&lt;br\/&gt;/g, '<br>');
    
    return sanitized;
  };
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
    />
  );
}

// Add a global style to forcibly remove borders and box-shadows from the info section
// You can move this to your global CSS if you prefer
const NoBorderStyle = () => (
  <style jsx global>{`
    .no-global-border, .no-global-border * {
      border: none !important;
      box-shadow: none !important;
      background: none !important;
    }
  `}</style>
);

export function AnimeDetails({ anime }: AnimeDetailsProps) {
  const { user } = useAuth()
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Check if anime is in watchlist using localStorage
      const checkWatchlist = () => {
        try {
          const watchlistKey = `watchlist-${user.uid}`
          const watchlist = JSON.parse(localStorage.getItem(watchlistKey) || '[]')
          setInWatchlist(watchlist.some((item: string) => item === anime.id))
        } catch (error) {
          console.error('Error checking watchlist:', error)
          setInWatchlist(false)
        }
      }
      checkWatchlist()
    } else {
      setInWatchlist(false)
    }
  }, [user, anime.id])

  const handleWatchlistToggle = () => {
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
      const watchlistKey = `watchlist-${user.uid}`
      let watchlist = []
      
      // Get current watchlist
      try {
        watchlist = JSON.parse(localStorage.getItem(watchlistKey) || '[]')
      } catch (e) {
        console.error('Error parsing watchlist:', e)
        watchlist = []
      }
      
      if (inWatchlist) {
        // Remove from watchlist
        watchlist = watchlist.filter((id: string) => id !== anime.id)
        setInWatchlist(false)
        toast({
          title: "Removed from watchlist",
          description: `${anime.title} has been removed from your watchlist`,
        })
      } else {
        // Add to watchlist
        watchlist.push(anime.id)
        setInWatchlist(true)
        toast({
          title: "Added to watchlist",
          description: `${anime.title} has been added to your watchlist`,
        })
      }
      
      // Save updated watchlist
      localStorage.setItem(watchlistKey, JSON.stringify(watchlist))
    } catch (error) {
      console.error('Error updating watchlist:', error)
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
            <ShareButton 
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`Check out ${anime.title} on Anime Stream`}
              variant="secondary"
            />
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

          <NoBorderStyle />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mb-6 text-sm no-global-border" style={{ border: 'none', boxShadow: 'none', background: 'none' }}>
            <div className="flex items-center gap-2 text-muted-foreground" style={{ border: 'none', boxShadow: 'none', background: 'none' }}>
              <Calendar className="h-4 w-4" />
              <span>Released: {anime.releaseDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground" style={{ border: 'none', boxShadow: 'none', background: 'none' }}>
              <Clock className="h-4 w-4" />
              <span>Duration: {anime.duration}</span>
            </div>
            {anime.studios.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground md:col-span-2 mt-1" style={{ border: 'none', boxShadow: 'none', background: 'none' }}>
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
              <SanitizedHTML 
                html={anime.description} 
                className="prose prose-sm dark:prose-invert max-w-none" 
              />
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
