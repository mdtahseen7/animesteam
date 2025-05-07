/**
 * Utility functions for anime scrapers
 */

/**
 * Get exact page of the episode in API.
 * @param episode Episode number
 * @param pages Total number of pages
 * @param totalEpisodes Total number of episodes
 * @returns The page number where the episode is located
 */
export function getExactPage(episode: number, pages: number, totalEpisodes: number): number {
  return Math.ceil((episode * pages) / totalEpisodes);
}

/**
 * Convert bytes to human-readable file size
 * @param sizeBytes Size in bytes
 * @returns Human-readable file size string
 */
export function convertSize(sizeBytes: number): string {
  if (sizeBytes === 0) {
    return "0B";
  }
  const sizeName = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(sizeBytes) / Math.log(1024));
  const p = Math.pow(1024, i);
  const s = Math.round((sizeBytes / p) * 100) / 100;
  return `${s} ${sizeName[i]}`;
}
