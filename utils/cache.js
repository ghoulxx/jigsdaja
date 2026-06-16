// Simple in-memory cache for the Minecraft status response.
// Stores the last fetched data and a timestamp.

const cache = {
  data: null,
  ts: 0
};

/**
 * Get cached data if fresh, otherwise null.
 * @param {number} ttl milliseconds
 */
function getCached(ttl) {
  if (!cache.data) return null;
  if (Date.now() - cache.ts > ttl) return null;
  return cache.data;
}

/**
 * Store data into cache with current timestamp.
 * @param {any} data
 */
function setCached(data) {
  cache.data = data;
  cache.ts = Date.now();
}

module.exports = { getCached, setCached };
