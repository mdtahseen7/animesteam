import axios from "axios"
import * as cheerio from "cheerio"

// Base URLs for different sources
const GOGOANIME_BASE_URL = "https://gogoanime.pe"
const ANILIST_BASE_URL = "https://graphql.anilist.co"
const JIKAN_BASE_URL = "https://api.jikan.moe/v4"
const NYAA_BASE_URL = "https://nyaa.si"

// Configure axios for AniList API
const anilistAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// GogoAnime scraper functions
export async function scrapeGogoAnimeSearch(query: string) {
  try {
    const searchUrl = `${GOGOANIME_BASE_URL}/search.html?keyword=${encodeURIComponent(query)}`
    const { data } = await axios.get(searchUrl)
    const $ = cheerio.load(data)

    const results: any[] = []
    $("div.last_episodes ul.items li").each((i, el) => {
      const title = $(el).find("p.name a").text().trim()
      const id = $(el).find("p.name a").attr("href")?.split("/")[2] || ""
      const image = $(el).find("div.img img").attr("src") || ""

      results.push({
        id,
        title,
        image,
        source: "gogoanime",
      })
    })

    return results
  } catch (error) {
    console.error("Error scraping GogoAnime search:", error)
    return []
  }
}

export async function scrapeGogoAnimeInfo(animeId: string) {
  try {
    const animeUrl = `${GOGOANIME_BASE_URL}/category/${animeId}`
    const { data } = await axios.get(animeUrl)
    const $ = cheerio.load(data)

    const title = $("div.anime_info_body_bg h1").text().trim()
    const image = $("div.anime_info_body_bg img").attr("src") || ""
    const description = $('div.anime_info_body_bg p.type:contains("Plot Summary")').next("p").text().trim()

    const info: Record<string, string> = {}
    $("div.anime_info_body_bg p.type").each((i, el) => {
      const type = $(el).text().trim().replace(":", "").trim()
      const value = $(el).next("p").text().trim()
      info[type.toLowerCase()] = value
    })

    const episodeCount = Number.parseInt($("#episode_page li a").last().text().split("-")[1]) || 0

    return {
      id: animeId,
      title,
      image,
      description,
      status: info["status"] || "Unknown",
      genres: info["genre"]?.split(",").map((g) => g.trim()) || [],
      releaseDate: info["released"] || "Unknown",
      episodeCount,
      source: "gogoanime",
    }
  } catch (error) {
    console.error("Error scraping GogoAnime info:", error)
    return null
  }
}

export async function scrapeGogoAnimeEpisodes(animeId: string) {
  try {
    const animeUrl = `${GOGOANIME_BASE_URL}/category/${animeId}`
    const { data } = await axios.get(animeUrl)
    const $ = cheerio.load(data)

    const episodeCount = Number.parseInt($("#episode_page li a").last().text().split("-")[1]) || 0
    const episodes = []

    for (let i = 1; i <= episodeCount; i++) {
      episodes.push({
        animeId,
        episodeNumber: i,
        title: `Episode ${i}`,
        streamUrl: `${GOGOANIME_BASE_URL}/${animeId}-episode-${i}`,
      })
    }

    return episodes
  } catch (error) {
    console.error("Error scraping GogoAnime episodes:", error)
    return []
  }
}

export async function scrapeGogoAnimeStreamUrl(episodeUrl: string) {
  try {
    const { data } = await axios.get(episodeUrl)
    const $ = cheerio.load(data)

    // Extract the iframe source
    const iframeSrc = $("div.play-video iframe").attr("src")

    if (!iframeSrc) {
      throw new Error("Iframe source not found")
    }

    // Get the streaming server page
    const { data: iframeData } = await axios.get(iframeSrc)
    const $iframe = cheerio.load(iframeData)

    // Extract the actual video URL (this is a simplified example)
    // In reality, this might involve more complex extraction or decryption
    const videoUrl = $iframe("source").attr("src") || $iframe("video").attr("data-src")

    return videoUrl
  } catch (error) {
    console.error("Error scraping GogoAnime stream URL:", error)
    return null
  }
}

// AniList API functions
export async function fetchAniListInfo(title: string) {
  try {
    const query = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            large
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
    `

    const { data } = await anilistAxios.post(ANILIST_BASE_URL, {
      query,
      variables: { search: title },
    })

    const anime = data.data.Media

    if (!anime) {
      return null
    }

    // Format trailer URL
    let trailerUrl = null
    if (anime.trailer) {
      if (anime.trailer.site === "youtube") {
        trailerUrl = `https://www.youtube.com/embed/${anime.trailer.id}`
      }
    }

    return {
      id: anime.id.toString(),
      title: anime.title.english || anime.title.romaji,
      image: anime.coverImage.large,
      banner: anime.bannerImage,
      description: anime.description,
      genres: anime.genres,
      status: anime.status,
      episodeCount: anime.episodes,
      duration: `${anime.duration} min`,
      releaseDate: anime.startDate.year
        ? `${anime.startDate.year}-${anime.startDate.month}-${anime.startDate.day}`
        : "Unknown",
      rating: anime.averageScore / 10,
      studios: anime.studios.nodes.map((studio: any) => studio.name),
      trailer: trailerUrl,
      source: "anilist",
    }
  } catch (error) {
    console.error("Error fetching AniList info:", error)
    return null
  }
}

// Fetch trending anime from AniList
export async function fetchTrendingAnime(limit = 10) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji english }
          coverImage { large }
          genres
          averageScore
        }
      }
    }
  `
  const variables = { page: 1, perPage: limit }
  const { data } = await anilistAxios.post(ANILIST_BASE_URL, { query, variables })
  return data.data.Page.media.map((anime: any) => ({
    id: anime.id.toString(),
    title: anime.title.english || anime.title.romaji,
    image: anime.coverImage.large,
    rating: anime.averageScore ? anime.averageScore / 10 : 0,
    genres: anime.genres,
    source: "anilist",
  }))
}

// Fetch ongoing anime from AniList (airing this season)
export async function fetchOngoingAnime(limit = 10) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large }
          genres
          episodes
        }
      }
    }
  `
  const variables = { page: 1, perPage: limit }
  const { data } = await anilistAxios.post(ANILIST_BASE_URL, { query, variables })
  return data.data.Page.media.map((anime: any) => ({
    id: anime.id.toString(),
    title: anime.title.english || anime.title.romaji,
    image: anime.coverImage.large,
    episodeCount: anime.episodes || 0,
    genres: anime.genres,
    source: "anilist",
  }))
}

// Fetch latest episodes (recently aired anime) from AniList
export async function fetchLatestEpisodes(limit = 10) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        airingSchedules(
          sort: TIME_DESC,
          notYetAired: false
        ) {
          episode
          airingAt
          media {
            id
            title { romaji english }
            coverImage { large }
          }
        }
      }
    }
  `
  const variables = { page: 1, perPage: limit * 2 } // Fetch more than needed to ensure diversity
  const { data } = await anilistAxios.post(ANILIST_BASE_URL, { query, variables })
  
  // Process the results to ensure diversity (only one episode per anime)
  const seenAnimeIds = new Set()
  const diverseEpisodes = []
  
  for (const schedule of data.data.Page.airingSchedules) {
    if (diverseEpisodes.length >= limit) break
    
    // Only add if we haven't seen this anime yet
    if (!seenAnimeIds.has(schedule.media.id)) {
      seenAnimeIds.add(schedule.media.id)
      diverseEpisodes.push({
        id: `${schedule.media.id}-ep${schedule.episode}`,
        animeId: schedule.media.id.toString(),
        animeTitle: schedule.media.title.english || schedule.media.title.romaji,
        episodeNumber: schedule.episode,
        thumbnail: schedule.media.coverImage.large,
        releaseDate: new Date(schedule.airingAt * 1000).toISOString(),
      })
    }
  }

  return diverseEpisodes
}

// Jikan API (MyAnimeList) functions
export async function fetchJikanInfo(title: string) {
  try {
    const { data } = await axios.get(`${JIKAN_BASE_URL}/anime`, {
      params: { q: title, limit: 1 },
    })

    if (!data.data || data.data.length === 0) {
      return null
    }

    const anime = data.data[0]

    return {
      id: anime.mal_id.toString(),
      title: anime.title,
      image: anime.images.jpg.large_image_url,
      banner: anime.images.jpg.large_image_url,
      description: anime.synopsis,
      genres: anime.genres.map((g: any) => g.name),
      status: anime.status,
      episodeCount: anime.episodes,
      duration: anime.duration,
      releaseDate: anime.aired.from ? new Date(anime.aired.from).toISOString().split("T")[0] : "Unknown",
      rating: anime.score / 2, // Convert to 5-star scale
      studios: anime.studios.map((s: any) => s.name),
      trailer: anime.trailer_url,
      source: "jikan",
    }
  } catch (error) {
    console.error("Error fetching Jikan info:", error)
    return null
  }
}

// Nyaa.si scraper for torrent links
export async function scrapeNyaaTorrents(title: string) {
  try {
    const searchUrl = `${NYAA_BASE_URL}/?f=0&c=1_2&q=${encodeURIComponent(title)}`
    const { data } = await axios.get(searchUrl)
    const $ = cheerio.load(data)

    const results: any[] = []
    $("table.torrent-list tbody tr").each((i, el) => {
      const name = $(el).find("td:nth-child(2) a:not(.comments)").text().trim()
      const torrentUrl = NYAA_BASE_URL + $(el).find("td:nth-child(3) a:nth-child(1)").attr("href")
      const magnetUrl = $(el).find("td:nth-child(3) a:nth-child(2)").attr("href")
      const size = $(el).find("td:nth-child(4)").text().trim()
      const date = $(el).find("td:nth-child(5)").text().trim()
      const seeders = Number.parseInt($(el).find("td:nth-child(6)").text().trim())
      const leechers = Number.parseInt($(el).find("td:nth-child(7)").text().trim())

      results.push({
        name,
        torrentUrl,
        magnetUrl,
        size,
        date,
        seeders,
        leechers,
      })
    })

    return results
  } catch (error) {
    console.error("Error scraping Nyaa torrents:", error)
    return []
  }
}

// Combined function to get complete anime info from multiple sources
export async function getCompleteAnimeInfo(title: string) {
  try {
    // Try AniList first for metadata
    const anilistInfo = await fetchAniListInfo(title)

    if (!anilistInfo) {
      // Fallback to Jikan/MAL
      const jikanInfo = await fetchJikanInfo(title)
      if (!jikanInfo) {
        return null
      }

      // Get episodes from GogoAnime
      const gogoResults = await scrapeGogoAnimeSearch(jikanInfo.title)
      const gogoId = gogoResults[0]?.id

      if (gogoId) {
        const episodes = await scrapeGogoAnimeEpisodes(gogoId)
        return {
          ...jikanInfo,
          episodes,
          gogoId,
        }
      }

      return jikanInfo
    }

    // Get episodes from GogoAnime
    const gogoResults = await scrapeGogoAnimeSearch(anilistInfo.title)
    const gogoId = gogoResults[0]?.id

    if (gogoId) {
      const episodes = await scrapeGogoAnimeEpisodes(gogoId)
      return {
        ...anilistInfo,
        episodes,
        gogoId,
      }
    }

    return anilistInfo
  } catch (error) {
    console.error("Error getting complete anime info:", error)
    return null
  }
}
