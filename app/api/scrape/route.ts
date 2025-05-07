import { type NextRequest, NextResponse } from "next/server"
import { getCompleteAnimeInfo } from "@/lib/scrapers/anime-scraper"
import { db } from "@/lib/firebase/admin"
import { verifyAdminSession } from "@/lib/firebase/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const sessionCookie = request.cookies.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdminSession(sessionCookie)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Scrape anime info
    const animeInfo = await getCompleteAnimeInfo(title)

    if (!animeInfo) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 })
    }

    // Save to Firestore
    const animeRef = db.collection("anime").doc()
    await animeRef.set({
      title: animeInfo.title,
      image: animeInfo.image,
      banner: animeInfo.banner,
      description: animeInfo.description,
      genres: animeInfo.genres,
      status: animeInfo.status,
      episodeCount: animeInfo.episodeCount,
      duration: animeInfo.duration,
      releaseDate: animeInfo.releaseDate,
      rating: animeInfo.rating,
      studios: animeInfo.studios,
      trailer: animeInfo.trailer,
      gogoId: animeInfo.gogoId,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Save episodes if available
    if (animeInfo.episodes && animeInfo.episodes.length > 0) {
      const batch = db.batch()

      animeInfo.episodes.forEach((episode: any) => {
        const episodeRef = db.collection("episodes").doc()
        batch.set(episodeRef, {
          animeId: animeRef.id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          streamUrl: episode.streamUrl,
          thumbnail: animeInfo.image, // Use anime image as fallback
          releaseDate: new Date(),
        })
      })

      await batch.commit()
    }

    return NextResponse.json({
      success: true,
      animeId: animeRef.id,
      episodeCount: animeInfo.episodes?.length || 0,
    })
  } catch (error: any) {
    console.error("Error in scrape API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
