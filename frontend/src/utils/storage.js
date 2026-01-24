/**
 * localStorage utility for caching API responses
 * Provides simple get/set/remove operations with JSON serialization
 */

const CACHE_PREFIX = 'gvmh_ed_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Get cached data from localStorage
 * @param {string} key - The cache key
 * @returns {any|null} - The cached data or null if not found/expired
 */
export const getCachedData = (key) => {
  try {
    const cachedItem = localStorage.getItem(CACHE_PREFIX + key)
    if (!cachedItem) return null

    const { data, timestamp } = JSON.parse(cachedItem)
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }

    return data
  } catch (error) {
    console.error('Error reading from cache:', error)
    return null
  }
}

/**
 * Save data to localStorage cache
 * @param {string} key - The cache key
 * @param {any} data - The data to cache
 */
export const setCachedData = (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem))
  } catch (error) {
    console.error('Error writing to cache:', error)
  }
}

/**
 * Remove data from localStorage cache
 * @param {string} key - The cache key
 */
export const removeCachedData = (key) => {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch (error) {
    console.error('Error removing from cache:', error)
  }
}

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}
