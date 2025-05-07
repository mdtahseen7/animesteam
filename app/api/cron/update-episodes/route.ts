import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/admin"
import { scrapeGogoAnimeEpisodes } from "@/lib/scrapers/anime-scraper"

// This route is protected by Vercel cron job authentication
export async function GET() {
  try {
    // Get all anime with gogoId
    const animeSnapshot = await db
      .collection("anime")
      .where("status", "==", "Ongoing")
      .where("gogoId", "!=", null)
      .get()

    if (animeSnapshot.empty) {
      return NextResponse.json({ message: "No ongoing anime found" })
    }

    let updatedCount = 0

    // Process each anime
    for (const animeDoc of animeSnapshot.docs) {
      const anime = { id: animeDoc.id, ...animeDoc.data() }

      // Get current episodes
      const episodesSnapshot = await db
        .collection("episodes")
        .where("animeId", "==", anime.id)
        .orderBy("episodeNumber", "desc")
        .limit(1)
        .get()

      const currentEpisodeCount = episodesSnapshot.empty ? 0 : episodesSnapshot.docs[0].data().episodeNumber

      // Scrape latest episodes
      const latestEpisodes = await scrapeGogoAnimeEpisodes(anime.gogoId)
      const latestEpisodeCount = latestEpisodes.length

      // If new episodes are available
      if (latestEpisodeCount > currentEpisodeCount) {
        const batch = db.batch()

        // Add new episodes
        for (let i = currentEpisodeCount + 1; i <= latestEpisodeCount; i++) {
          const episode = latestEpisodes.find((ep) => ep.episodeNumber === i)

          if (episode) {
            const episodeRef = db.collection("episodes").doc()
            batch.set(episodeRef, {
              animeId: anime.id,
              episodeNumber: episode.episodeNumber,
              title: episode.title,
              streamUrl: episode.streamUrl,
              thumbnail: anime.image, // Use anime image as fallback
              releaseDate: new Date(),
            })
          }
        }

        // Update anime episode count
        batch.update(animeDoc.ref, {
          episodeCount: latestEpisodeCount,
          updatedAt: new Date(),
        })

        await batch.commit()
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} anime with new episodes`,
    })
  } catch (error: any) {
    console.error("Error in update episodes cron:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
