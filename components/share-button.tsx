"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
  url?: string
  title?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ShareButton({ 
  url, 
  title = "Share this anime", 
  variant = "outline",
  size = "sm"
}: ShareButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const { toast } = useToast()
  
  // Check if the Web Share API is supported
  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])
  
  const handleShare = async () => {
    try {
      const shareData = {
        title: title,
        url: url || window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully",
          description: "Content has been shared",
        })
      } else {
        // Fallback to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url)
          toast({
            title: "Link copied",
            description: "Link copied to clipboard",
          })
        } else {
          // Manual fallback
          const textArea = document.createElement("textarea")
          textArea.value = shareData.url
          textArea.style.position = "fixed"
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          
          try {
            document.execCommand("copy")
            toast({
              title: "Link copied",
              description: "Link copied to clipboard",
            })
          } catch (err) {
            toast({
              title: "Failed to copy",
              description: "Please copy the URL manually",
              variant: "destructive",
            })
          }
          
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error sharing",
        description: "Failed to share content",
        variant: "destructive",
      })
    }
  }
  
  return (
    <Button 
      onClick={handleShare} 
      variant={variant} 
      size={size}
      className="gap-2"
    >
      <Share className="h-4 w-4" />
      Share
    </Button>
  )
}
