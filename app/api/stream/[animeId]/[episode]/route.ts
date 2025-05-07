import { NextRequest, NextResponse } from "next/server";
import { 
  scrapeGogoAnimeSearch, 
  scrapeGogoAnimeEpisodes, 
  scrapeGogoAnimeStreamUrl,
  fetchAniListInfo
} from "@/lib/scrapers/anime-scraper";
import {
  scrapeAnimepaheSearch,
  scrapeAnimepaheEpisodes,
  scrapeAnimepaheStreamUrl
} from "@/lib/scrapers/animepahe-scraper";
import { getEpisodeDetails, getStreamUrl } from "@/lib/anime-service";

/**
 * API route to get stream URL for an episode
 * This acts as a proxy to avoid CORS issues and to handle the scraping logic server-side
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { animeId: string; episode: string } }
) {
  try {
    const { animeId, episode } = params;
    const episodeNumber = parseInt(episode, 10);
    console.log(`Stream request for ${animeId}, episode ${episodeNumber}`);

    if (isNaN(episodeNumber)) {
      return NextResponse.json(
        { error: "Invalid episode number" },
        { status: 400 }
      );
    }
    
    // Check if animeId includes source information (format: source:id)
    if (animeId.includes(':')) {
      const [source, id] = animeId.split(':');
      console.log(`Using ${source} as source for ${id}`);
      
      // Get episode details using the anime service
      const episodeDetails = await getEpisodeDetails(animeId, episodeNumber);
      
      if (!episodeDetails) {
        console.log(`Episode ${episodeNumber} not found for ${animeId}`);
        return NextResponse.json(
          { error: "Episode not found" },
          { status: 404 }
        );
      }
      
      // Get stream URL using the anime service
      const streamData = await getStreamUrl(animeId, episodeDetails.id);
      
      if (!streamData) {
        console.log(`Stream not available for ${animeId}, episode ${episodeNumber}`);
        return NextResponse.json(
          { error: "Stream not available" },
          { status: 404 }
        );
      }
      
      // Return the stream data
      return NextResponse.json(streamData);
    }

    // Check if animeId is numeric (likely an AniList ID)
    const isNumericId = /^\d+$/.test(animeId);
    
    if (isNumericId) {
      console.log("Handling numeric AniList ID:", animeId);
      // For numeric IDs, try to get info from AniList first
      try {
        const anilistInfo = await fetchAniListInfo(animeId);
        
        if (anilistInfo) {
          // Use the title to search on GogoAnime
          const title = anilistInfo.title;
          console.log("Searching GogoAnime with title:", title);
          const gogoResults = await scrapeGogoAnimeSearch(title);
          
          if (gogoResults && gogoResults.length > 0) {
            // Use the first result
            const gogoAnimeId = gogoResults[0].id;
            console.log("Found GogoAnime ID:", gogoAnimeId);
            
            // Get all episodes
            const episodes = await scrapeGogoAnimeEpisodes(gogoAnimeId);
            
            // Find the requested episode
            const targetEpisode = episodes.find(
              (ep) => ep.episodeNumber === episodeNumber
            );
            
            if (!targetEpisode) {
              console.log("Episode not found:", episodeNumber);
              return NextResponse.json(
                { error: "Episode not found" },
                { status: 404 }
              );
            }
            
            // Get the stream URL
            console.log("Getting stream URL for:", targetEpisode.streamUrl);
            const streamUrl = await scrapeGogoAnimeStreamUrl(targetEpisode.streamUrl);
            
            if (!streamUrl) {
              console.log("Stream not available");
              return NextResponse.json(
                { error: "Stream not available" },
                { status: 404 }
              );
            }
            
            // Redirect to the stream URL
            console.log("Redirecting to stream URL");
            return NextResponse.redirect(streamUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching from AniList:", error);
        // Continue with other methods if AniList fails
      }
    }
    
    // Try to find the anime on GogoAnime directly
    console.log("Searching GogoAnime directly with:", animeId);
    const searchResults = await scrapeGogoAnimeSearch(animeId);
    
    if (!searchResults || searchResults.length === 0) {
      // If no direct match, try to search by ID as a title
      console.log("No direct match, trying with spaces:", animeId.replace(/-/g, " "));
      const secondAttempt = await scrapeGogoAnimeSearch(
        animeId.replace(/-/g, " ")
      );
      
      // Try a third attempt with common anime keywords
      if (!secondAttempt || secondAttempt.length === 0) {
        console.log("Second attempt failed, trying with anime keywords");
        const keywords = ["anime", "tv", "season", "episode"];
        
        for (const keyword of keywords) {
          const thirdAttempt = await scrapeGogoAnimeSearch(
            `${animeId.replace(/-/g, " ")} ${keyword}`
          );
          
          if (thirdAttempt && thirdAttempt.length > 0) {
            // Use the first result
            const gogoAnimeId = thirdAttempt[0].id;
            console.log("Found with keyword search:", gogoAnimeId);
            
            // Get all episodes
            const episodes = await scrapeGogoAnimeEpisodes(gogoAnimeId);
            
            // Find the requested episode
            const targetEpisode = episodes.find(
              (ep) => ep.episodeNumber === episodeNumber
            );
            
            if (!targetEpisode) {
              continue; // Try next keyword if episode not found
            }
            
            // Get the stream URL
            const streamUrl = await scrapeGogoAnimeStreamUrl(targetEpisode.streamUrl);
            
            if (!streamUrl) {
              continue; // Try next keyword if stream not available
            }
            
            // Redirect to the stream URL
            return NextResponse.redirect(streamUrl);
          }
        }
        
        // If all attempts fail
        console.log("All attempts failed");
        return NextResponse.json(
          { error: "Anime not found" },
          { status: 404 }
        );
      }
      
      // Use the first result from second attempt
      const gogoAnimeId = secondAttempt[0].id;
      console.log("Using result from second attempt:", gogoAnimeId);
      
      // Get all episodes
      const episodes = await scrapeGogoAnimeEpisodes(gogoAnimeId);
      
      // Find the requested episode
      const targetEpisode = episodes.find(
        (ep) => ep.episodeNumber === episodeNumber
      );
      
      if (!targetEpisode) {
        console.log("Episode not found:", episodeNumber);
        return NextResponse.json(
          { error: "Episode not found" },
          { status: 404 }
        );
      }
      
      // Get the stream URL
      const streamUrl = await scrapeGogoAnimeStreamUrl(targetEpisode.streamUrl);
      
      if (!streamUrl) {
        console.log("Stream not available");
        return NextResponse.json(
          { error: "Stream not available" },
          { status: 404 }
        );
      }
      
      // Redirect to the stream URL
      console.log("Redirecting to stream URL");
      return NextResponse.redirect(streamUrl);
    }
    
    // Use the first result from GogoAnime
    const gogoAnimeId = searchResults[0].id;
    
    // Get all episodes
    const episodes = await scrapeGogoAnimeEpisodes(gogoAnimeId);
    
    // Find the requested episode
    const targetEpisode = episodes.find(
      (ep) => ep.episodeNumber === episodeNumber
    );
    
    if (!targetEpisode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }
    
    // Get the stream URL
    const streamUrl = await scrapeGogoAnimeStreamUrl(targetEpisode.streamUrl);
    
    if (!streamUrl) {
      return NextResponse.json(
        { error: "Stream not available" },
        { status: 404 }
      );
    }
    
    // Redirect to the stream URL
    return NextResponse.redirect(streamUrl);
  } catch (error) {
    console.error("Error in stream API:", error);
    return NextResponse.json(
      { error: "Failed to get stream URL", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
