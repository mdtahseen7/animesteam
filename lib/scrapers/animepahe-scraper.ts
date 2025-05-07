import axios from 'axios'
import * as cheerio from 'cheerio'
import { convertSize, getExactPage } from './utils'

const ANIMEPAHE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://animepahe.com/'
};

export interface AnimepaheSearchResult {
  id: string
  title: string
  type: string
  episodes: number
  status: string
  season: string
  year: number
  score: number
  poster: string
  session: string
}

export interface AnimepaheEpisode {
  id: number
  episode: number
  snapshot: string
  duration: string
  session: string
}

export interface AnimepaheStreamLink {
  quality: string
  size: string
  audio: string
  url: string
}

export const ANIMEPAHE_BASE_URL = 'https://animepahe.com'
export const ANIMEPAHE_API_URL = 'https://animepahe.com/api?m='

/**
 * Search for anime on AnimePahe
 */
export async function scrapeAnimepaheSearch(query: string) {
  try {
    const url = `${ANIMEPAHE_API_URL}search&q=${encodeURIComponent(query).replace(/%20/g, '&')}`
    const { data } = await axios.get(url, { headers: ANIMEPAHE_HEADERS })
    
    if (!data.data || !Array.isArray(data.data)) {
      return []
    }
    
    return data.data.map((item: AnimepaheSearchResult) => ({
      id: item.session,
      title: item.title,
      image: item.poster,
      releaseDate: `${item.season} ${item.year}`,
      type: item.type,
      status: item.status,
      episodeCount: item.episodes,
      score: item.score,
    }))
  } catch (error) {
    console.error('Error scraping AnimePahe search:', error)
    return []
  }
}

/**
 * Get anime info from AnimePahe
 */
export async function scrapeAnimepaheInfo(animeId: string) {
  try {
    // First, search for the anime to get its details
    const searchUrl = `${ANIMEPAHE_API_URL}search&q=${encodeURIComponent(animeId)}`
    const { data: searchData } = await axios.get(searchUrl)
    
    if (!searchData.data || !Array.isArray(searchData.data) || searchData.data.length === 0) {
      return null
    }
    
    const anime = searchData.data[0]
    
    // Get the first episode to extract more details
    const releaseUrl = `${ANIMEPAHE_API_URL}release&id=${anime.session}&sort=episode_asc&page=1`
    const { data: releaseData } = await axios.get(releaseUrl)
    
    return {
      id: anime.session,
      title: anime.title,
      image: anime.poster,
      banner: anime.poster, // AnimePahe doesn't provide banner images
      description: '', // Need to scrape the main page to get this
      genres: [], // Need to scrape the main page to get this
      status: anime.status,
      releaseDate: `${anime.season} ${anime.year}`,
      rating: anime.score,
      episodeCount: anime.episodes,
      duration: releaseData.data && releaseData.data[0] ? releaseData.data[0].duration : 'Unknown',
      studios: [],
    }
  } catch (error) {
    console.error('Error scraping AnimePahe info:', error)
    return null
  }
}

/**
 * Get episodes list from AnimePahe
 */
export async function scrapeAnimepaheEpisodes(animeId: string) {
  try {
    const url = `${ANIMEPAHE_API_URL}release&id=${animeId}&sort=episode_asc&page=1`
    const { data } = await axios.get(url, { headers: ANIMEPAHE_HEADERS })
    
    if (!data.data || !Array.isArray(data.data)) {
      return []
    }
    
    // Get total episodes and pages
    const totalEpisodes = data.total
    const lastPage = data.last_page
    
    // If there's only one page, return all episodes
    if (lastPage === 1) {
      return data.data.map((episode: AnimepaheEpisode) => ({
        id: episode.session,
        number: episode.episode,
        title: `Episode ${episode.episode}`,
      }))
    }
    
    // If there are multiple pages, we need to fetch all pages
    const allEpisodes = [...data.data]
    
    for (let page = 2; page <= lastPage; page++) {
      const pageUrl = `${ANIMEPAHE_API_URL}release&id=${animeId}&sort=episode_asc&page=${page}`
      const { data: pageData } = await axios.get(pageUrl, { headers: ANIMEPAHE_HEADERS })
      
      if (pageData.data && Array.isArray(pageData.data)) {
        allEpisodes.push(...pageData.data)
      }
    }
    
    return allEpisodes.map((episode: AnimepaheEpisode) => ({
      id: episode.session,
      number: episode.episode,
      title: `Episode ${episode.episode}`,
    }))
  } catch (error) {
    console.error('Error scraping AnimePahe episodes:', error)
    return []
  }
}

/**
 * Get stream URL from AnimePahe
 */
export async function scrapeAnimepaheStreamUrl(episodeId: string) {
  try {
    // Get download links
    const url = `${ANIMEPAHE_API_URL}links&id=${episodeId}&p=kwik`
    const { data } = await axios.get(url, { headers: ANIMEPAHE_HEADERS })
    
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return null
    }
    
    // Extract qualities, filesizes, audios, and kwik links
    const streamLinks: AnimepaheStreamLink[] = []
    
    for (const file of data.data) {
      const quality = Object.keys(file)[0]
      const details = file[quality]
      
      if (!details || !details.kwik) continue
      
      // Get the direct URL from kwik
      const kwikUrl = details.kwik
      const headers = { Referer: 'https://animepahe.com/' }
      const response = await axios.get(kwikUrl, { headers: ANIMEPAHE_HEADERS })
      
      const $ = cheerio.load(response.data)
      const scripts = $('script').toArray()
      
      if (scripts.length < 7) continue
      
      const scriptContent = $(scripts[6]).html()
      if (!scriptContent) continue
      
      // Extract the URL components from the script
      const parts = scriptContent.split('Plyr')[1]?.split('.split')[0]?.split('|')
      if (!parts || parts.length < 10) continue
      
      const finalUrl = `https://${parts[parts.length-2]}-${parts[parts.length-3]}.${parts[parts.length-4]}.${parts[parts.length-5]}.${parts[parts.length-6]}/hls/${parts[parts.length-8]}/${parts[parts.length-9]}/${parts[parts.length-10]}/owo.m3u8`
      
      streamLinks.push({
        quality,
        size: details.filesize ? convertSize(details.filesize) : 'Unknown',
        audio: details.audio === 'jpn' ? 'japanese' : 'english',
        url: finalUrl
      })
    }
    
    // Return the highest quality stream URL
    if (streamLinks.length > 0) {
      // Sort by quality (assuming format like "1080p", "720p", etc.)
      streamLinks.sort((a, b) => {
        const qualityA = parseInt(a.quality.replace(/[^0-9]/g, ''))
        const qualityB = parseInt(b.quality.replace(/[^0-9]/g, ''))
        return qualityB - qualityA // Descending order
      })
      
      return {
        sources: streamLinks.map(link => ({
          url: link.url,
          quality: link.quality,
          isM3U8: link.url.includes('.m3u8')
        })),
        headers: { Referer: 'https://kwik.cx/' }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error scraping AnimePahe stream URL:', error)
    return null
  }
}
