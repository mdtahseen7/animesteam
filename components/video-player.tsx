"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-hooks"
import { AlertCircle, ExternalLink } from "lucide-react"

// Dynamically import Plyr to avoid SSR issues
const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-card/30 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading video player...</p>
      </div>
    </div>
  ),
})

// Import CSS in a way that works with SSR
import "plyr-react/plyr.css"

interface VideoPlayerProps {
  animeId: string
  episodeId: string
  episodeNumber: number
  streamUrl?: string
}

export function VideoPlayer({ animeId, episodeId, episodeNumber, streamUrl }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const playerRef = useRef<any>(null)
  const watchHistoryUpdated = useRef(false)

  useEffect(() => {
    // Reset state when episode changes
    setLoading(true)
    setError(null)
    setFallbackMode(false)
    watchHistoryUpdated.current = false
  }, [episodeId])

  useEffect(() => {
    const updateHistory = () => {
      if (user && !watchHistoryUpdated.current) {
        try {
          // Update watch history in localStorage
          const historyKey = `watchHistory-${user.uid}-${animeId}`;
          let history: number[] = [];
          
          // Get existing history
          const storedHistory = localStorage.getItem(historyKey);
          if (storedHistory) {
            history = JSON.parse(storedHistory);
          }
          
          // Add current episode if not already in history
          if (!history.includes(episodeNumber)) {
            history.push(episodeNumber);
            localStorage.setItem(historyKey, JSON.stringify(history));
          }
          
          watchHistoryUpdated.current = true;
        } catch (error) {
          console.error("Failed to update watch history:", error);
        }
      }
    };

    // Update watch history after 30 seconds of watching
    const timer = setTimeout(() => {
      updateHistory();
    }, 30000);

    return () => clearTimeout(timer);
  }, [user, animeId, episodeNumber])

  useEffect(() => {
    // Simulate loading the video
    const timer = setTimeout(() => {
      if (!streamUrl) {
        setError("Stream not available. Please try again later.")
      } else {
        setLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [streamUrl])

  const handleFallbackMode = () => {
    setFallbackMode(true)
    toast({
      title: "Switched to fallback player",
      description: "Using external player for better compatibility",
    })
  }

  if (loading) {
    return (
      <div className="w-full aspect-video bg-card/30 rounded-lg mb-6 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading video player...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-card/30 rounded-lg mb-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (fallbackMode) {
    return (
      <div className="video-player-container mb-6">
        <iframe 
          src={streamUrl || `/api/stream/${animeId}/${episodeNumber}`} 
          allowFullScreen 
          title={`Episode ${episodeNumber}`} 
          className="rounded-lg"
        ></iframe>
      </div>
    )
  }

  return (
    <div className="video-player-container mb-6">
      <div className="plyr__video-embed rounded-lg overflow-hidden">
        <Plyr
          ref={playerRef}
          source={{
            type: "video",
            sources: [
              {
                src: streamUrl || `/api/stream/${animeId}/${episodeNumber}`,
                type: "video/mp4",
              },
            ],
          }}
          options={{
            controls: [
              "play-large",
              "play",
              "progress",
              "current-time",
              "mute",
              "volume",
              "captions",
              "settings",
              "pip",
              "airplay",
              "fullscreen",
            ],
            i18n: {
              restart: "Restart",
              rewind: "Rewind {seektime}s",
              play: "Play",
              pause: "Pause",
              fastForward: "Forward {seektime}s",
              seek: "Seek",
              seekLabel: "{currentTime} of {duration}",
              played: "Played",
              buffered: "Buffered",
              currentTime: "Current time",
              duration: "Duration",
              volume: "Volume",
              mute: "Mute",
              unmute: "Unmute",
              enableCaptions: "Enable captions",
              disableCaptions: "Disable captions",
              enterFullscreen: "Enter fullscreen",
              exitFullscreen: "Exit fullscreen",
              frameTitle: "Player for {title}",
              captions: "Captions",
              settings: "Settings",
              menuBack: "Go back to previous menu",
              speed: "Speed",
              normal: "Normal",
              quality: "Quality",
              loop: "Loop",
            },
          }}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleFallbackMode}>
          <ExternalLink className="h-3 w-3" />
          Switch to external player
        </Button>
      </div>
    </div>
  )
}
