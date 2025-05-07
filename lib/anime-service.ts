import { 
  getCompleteAnimeInfo, 
  fetchTrendingAnime, 
  fetchOngoingAnime, 
  fetchLatestEpisodes,
  scrapeGogoAnimeSearch,
  scrapeGogoAnimeInfo,
  scrapeGogoAnimeEpisodes,
  scrapeGogoAnimeStreamUrl
} from "@/lib/scrapers/anime-scraper";

import {
  scrapeAnimepaheSearch,
  scrapeAnimepaheInfo,
  scrapeAnimepaheEpisodes,
  scrapeAnimepaheStreamUrl,
} from "@/lib/scrapers/animepahe-scraper";

// Define interfaces for type safety
export interface Anime {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  genres: string[];
  status: string;
  episodeCount: number;
  duration: string;
  releaseDate: string;
  rating: number;
  studios: string[];
  trailer?: string;
}

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  streamUrl?: string;
  thumbnail?: string;
  releaseDate?: string;
}

/**
 * Fetches anime details by ID directly from scrapers
 */
export async function getAnimeDetails(id: string): Promise<Anime | null> {
  try {
    // First try to get from GogoAnime
    // Check if the ID is a GogoAnime ID (usually contains hyphens)
    if (id.includes('-')) {
      const gogoAnimeInfo = await scrapeGogoAnimeInfo(id);
      
      if (gogoAnimeInfo) {
        return {
          id: id,
          title: gogoAnimeInfo.title || "Unknown Title",
          image: gogoAnimeInfo.image || "/placeholder.svg",
          banner: gogoAnimeInfo.image || "/placeholder.svg", // GogoAnime doesn't provide banners
          description: gogoAnimeInfo.description || "No description available.",
          genres: Array.isArray(gogoAnimeInfo.genres) ? gogoAnimeInfo.genres : [],
          status: gogoAnimeInfo.status || "Unknown",
          episodeCount: gogoAnimeInfo.episodeCount || 0,
          duration: "Unknown", // GogoAnime doesn't provide duration
          releaseDate: gogoAnimeInfo.releaseDate || "Unknown",
          rating: 0, // GogoAnime doesn't provide ratings
          studios: [], // GogoAnime doesn't provide studios
          trailer: undefined
        };
      }
    }
    
    // If not in Firebase, try to get from scraper directly
    // For AniList IDs (numeric)
    if (/^\d+$/.test(id)) {
      const query = `
        query {
          Media(id: ${id}, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            description
            coverImage {
              large
              extraLarge
            }
            bannerImage
            genres
            status
            episodes
            duration
            startDate {
              year
              month
              day
            }
            averageScore
            studios {
              nodes {
                name
              }
            }
            trailer {
              id
              site
            }
          }
        }
      `;
      
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      
      const { data } = await response.json();
      
      if (data?.Media) {
        const anime = data.Media;
        return {
          id: anime.id.toString(),
          title: anime.title.english || anime.title.romaji,
          image: anime.coverImage.extraLarge || anime.coverImage.large,
          banner: anime.bannerImage || anime.coverImage.extraLarge,
          description: anime.description,
          genres: anime.genres,
          status: anime.status,
          episodeCount: anime.episodes || 0,
          duration: `${anime.duration} min`,
          releaseDate: anime.startDate ? `${anime.startDate.year}-${anime.startDate.month}-${anime.startDate.day}` : "Unknown",
          rating: anime.averageScore ? anime.averageScore / 20 : 0, // Convert to 5-star scale
          studios: anime.studios?.nodes?.map((s: any) => s.name) || [],
          trailer: anime.trailer?.site === "youtube" ? `https://www.youtube.com/embed/${anime.trailer.id}` : undefined,
        };
      }
    }
    
    // Try to get complete info from multiple sources
    const animeInfo = await getCompleteAnimeInfo(id);
    if (animeInfo) {
      // Create a properly typed anime object
      return {
        id: id,
        title: animeInfo.title || "Unknown Title",
        image: animeInfo.image || "/placeholder.svg",
        banner: animeInfo.banner || animeInfo.image || "/placeholder.svg",
        description: animeInfo.description || "No description available.",
        genres: Array.isArray(animeInfo.genres) ? animeInfo.genres : [],
        status: animeInfo.status || "Unknown",
        episodeCount: animeInfo.episodeCount || 0,
        duration: animeInfo.duration || "Unknown",
        releaseDate: animeInfo.releaseDate || "Unknown",
        rating: typeof animeInfo.rating === 'number' ? animeInfo.rating : 0,
        studios: Array.isArray(animeInfo.studios) ? animeInfo.studios : [],
        trailer: animeInfo.trailer || undefined
      };
    }
    
    // Try to get from AnimePahe
    const animepaheInfo = await scrapeAnimepaheInfo(id);
    if (animepaheInfo) {
      return {
        id: id,
        title: animepaheInfo.title || "Unknown Title",
        image: animepaheInfo.image || "/placeholder.svg",
        banner: animepaheInfo.image || "/placeholder.svg", // AnimePahe doesn't provide banners
        description: animepaheInfo.description || "No description available.",
        genres: Array.isArray(animepaheInfo.genres) ? animepaheInfo.genres : [],
        status: animepaheInfo.status || "Unknown",
        episodeCount: animepaheInfo.episodeCount || 0,
        duration: "Unknown", // AnimePahe doesn't provide duration
        releaseDate: animepaheInfo.releaseDate || "Unknown",
        rating: 0, // AnimePahe doesn't provide ratings
        studios: [], // AnimePahe doesn't provide studios
        trailer: undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching anime details:", error);
    return null;
  }
}

/**
 * Search for anime by title
 * @param query Search query
 * @param source Optional source to use (gogoanime or animepahe)
 */
export async function searchAnime(query: string, source: 'gogoanime' | 'animepahe' = 'animepahe') {
  try {
    if (source === 'animepahe') {
      // Search using AnimePahe
      const results = await scrapeAnimepaheSearch(query)
      return results.map((anime: any) => ({
        ...anime,
        id: `animepahe:${anime.id}`,
        source: 'animepahe'
      }))
    } else {
      // Search using GogoAnime
      const results = await scrapeGogoAnimeSearch(query)
      return results.map((anime: any) => ({
        ...anime,
        id: `gogoanime:${anime.id}`,
        source: 'gogoanime'
      }))
    }
  } catch (error) {
    console.error(`Error searching anime from ${source}:`, error)
    return []
  }
}

/**
 * Fetches episode by number directly from scrapers
 */
export async function getEpisodeDetails(animeId: string, episodeNumber: number): Promise<Episode | null> {
  try {
    // If source is specified in the ID (format: source:id)
    let source: 'gogoanime' | 'animepahe' | undefined = 'animepahe'; // Default to animepahe
    let actualAnimeId = animeId;
    
    if (animeId.includes(':')) {
      const [srcType, id] = animeId.split(':');
      source = srcType as 'gogoanime' | 'animepahe';
      actualAnimeId = id;
    }
    
    console.log(`Fetching episode ${episodeNumber} from ${source} for ${actualAnimeId}`);
    
    let episodes = [];
    let episode = null;
    
    // Try the specified/default source first
    try {
      if (source === 'animepahe') {
        episodes = await scrapeAnimepaheEpisodes(actualAnimeId);
      } else {
        episodes = await scrapeGogoAnimeEpisodes(actualAnimeId);
      }
      
      // Find the requested episode
      episode = episodes.find((ep: any) => ep.number === episodeNumber);
    } catch (sourceError) {
      console.error(`Error fetching from ${source}:`, sourceError);
    }
    
    // If we couldn't find the episode with the primary source, try the alternative
    if (!episode) {
      try {
        if (source === 'animepahe') {
          // Try GogoAnime as fallback
          episodes = await scrapeGogoAnimeEpisodes(actualAnimeId);
        } else {
          // Try AnimePahe as fallback
          episodes = await scrapeAnimepaheEpisodes(actualAnimeId);
        }
        
        // Find the requested episode
        episode = episodes.find((ep: any) => ep.number === episodeNumber);
      } catch (fallbackError) {
        console.error(`Error fetching from fallback source:`, fallbackError);
      }
    }
    
    if (episode) {
      console.log(`Found episode ${episodeNumber} with ID ${episode.id}`);
      return {
        id: episode.id,
        animeId: animeId,
        episodeNumber: episodeNumber,
        title: episode.title || `Episode ${episodeNumber}`,
        streamUrl: `/api/stream/${animeId}/${episodeNumber}`,
        thumbnail: episode.thumbnail || "/placeholder.svg",
        releaseDate: episode.releaseDate || new Date().toISOString(),
        source: source
      };
    }
    
    console.log(`Creating generic episode ${episodeNumber} for ${animeId}`);
    // If we couldn't find the episode, return a generic one
    // The actual streaming will be handled by the API
    return {
      id: `${actualAnimeId}-${episodeNumber}`,
      animeId,
      episodeNumber,
      title: `Episode ${episodeNumber}`,
      streamUrl: `/api/stream/${animeId}/${episodeNumber}`,
      thumbnail: "/placeholder.svg",
      releaseDate: new Date().toISOString(),
      source: source
    };
  } catch (error) {
    console.error("Error fetching episode details:", error);
    return null;
  }
}

/**
 * Get stream URL for an episode
 * @param animeId Anime ID (may include source prefix)
 * @param episodeId Episode ID
 */
export async function getStreamUrl(animeId: string, episodeId: string) {
  try {
    // Check if animeId includes source information
    let source: 'gogoanime' | 'animepahe' | undefined;
    
    if (animeId.includes(':')) {
      const [srcType, _] = animeId.split(':');
      source = srcType as 'gogoanime' | 'animepahe';
    }
    
    // Get stream URL from the appropriate source
    if (source === 'animepahe') {
      return await scrapeAnimepaheStreamUrl(episodeId);
    } else {
      return await scrapeGogoAnimeStreamUrl(episodeId);
    }
  } catch (error) {
    console.error(`Error getting stream URL:`, error);
    return null;
  }
}
