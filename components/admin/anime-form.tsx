"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/admin/image-upload"
import { useToast } from "@/hooks/use-toast"
import { addAnime, updateAnime } from "@/lib/firebase/client"
import { Loader2 } from "lucide-react"

interface AnimeFormProps {
  anime?: any
  isEdit?: boolean
}

export function AnimeForm({ anime, isEdit = false }: AnimeFormProps) {
  const [formData, setFormData] = useState({
    title: anime?.title || "",
    description: anime?.description || "",
    image: anime?.image || "",
    banner: anime?.banner || "",
    genres: anime?.genres?.join(", ") || "",
    status: anime?.status || "Ongoing",
    episodeCount: anime?.episodeCount || 0,
    duration: anime?.duration || "",
    releaseDate: anime?.releaseDate || "",
    rating: anime?.rating || 0,
    studios: anime?.studios?.join(", ") || "",
    trailer: anime?.trailer || "",
    gogoId: anime?.gogoId || "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
  }

  const handleBannerUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, banner: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const animeData = {
        ...formData,
        genres: formData.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        studios: formData.studios
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        episodeCount: Number(formData.episodeCount),
        rating: Number(formData.rating),
      }

      if (isEdit && anime?.id) {
        await updateAnime(anime.id, animeData)
        toast({
          title: "Anime updated",
          description: `${formData.title} has been updated successfully`,
        })
      } else {
        const animeId = await addAnime(animeData)
        toast({
          title: "Anime added",
          description: `${formData.title} has been added successfully`,
        })
        router.push(`/admin/anime/${animeId}`)
      }
    } catch (error) {
      console.error("Error saving anime:", error)
      toast({
        title: "Error",
        description: "Failed to save anime data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Anime" : "Add New Anime"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              {formData.image && (
                <div className="mb-2">
                  <img
                    src={formData.image || "/placeholder.svg"}
                    alt="Cover"
                    className="h-40 object-cover rounded-md"
                  />
                </div>
              )}
              <ImageUpload onUploadComplete={handleImageUpload} folder="anime/covers" />
              <Input
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Or enter image URL"
                className="mt-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Image</Label>
              {formData.banner && (
                <div className="mb-2">
                  <img
                    src={formData.banner || "/placeholder.svg"}
                    alt="Banner"
                    className="h-40 object-cover rounded-md"
                  />
                </div>
              )}
              <ImageUpload onUploadComplete={handleBannerUpload} folder="anime/banners" />
              <Input
                name="banner"
                value={formData.banner}
                onChange={handleChange}
                placeholder="Or enter banner URL"
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genres">Genres (comma separated)</Label>
              <Input
                id="genres"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                placeholder="Action, Adventure, Comedy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studios">Studios (comma separated)</Label>
              <Input
                id="studios"
                name="studios"
                value={formData.studios}
                onChange={handleChange}
                placeholder="Studio A, Studio B"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episodeCount">Episode Count</Label>
              <Input
                id="episodeCount"
                name="episodeCount"
                type="number"
                min="0"
                value={formData.episodeCount}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="24 min"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                name="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trailer">Trailer URL (YouTube embed)</Label>
              <Input
                id="trailer"
                name="trailer"
                value={formData.trailer}
                onChange={handleChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gogoId">GogoAnime ID (for scraping)</Label>
            <Input id="gogoId" name="gogoId" value={formData.gogoId} onChange={handleChange} placeholder="one-piece" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Update Anime" : "Add Anime"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
