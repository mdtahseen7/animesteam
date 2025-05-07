"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import { getComments, addComment } from "@/lib/firebase/client"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  userId: string
  username: string
  userAvatar?: string
  text: string
  createdAt: string
}

interface CommentsProps {
  animeId: string
  episodeId: string
}

export function Comments({ animeId, episodeId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentList = await getComments(animeId, episodeId)
        setComments(commentList)
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [animeId, episodeId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const comment = await addComment(animeId, episodeId, user.uid, newComment)
      setComments([comment, ...comments])
      setNewComment("")
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Comments</h2>

      <form onSubmit={handleSubmitComment} className="space-y-4">
        <Textarea
          placeholder={user ? "Add a comment..." : "Please log in to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || submitting}
          className="min-h-[100px] bg-card/30"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!user || submitting || !newComment.trim()}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={comment.userAvatar || "/placeholder.svg"} />
                  <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{comment.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground pl-10">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
