import redis, { isRedisConnected } from './redis.client.js';

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SEC || '60', 10);

/**
 * Builds a deterministic cache key by sorting query parameters.
 */
function buildCacheKey(apiId, path, query) {
    const searchParams = new URLSearchParams(query);
    searchParams.sort();
    const queryString = searchParams.toString();
    const cleanPath = path ? path.replace(/^\/+|\/+$/g, '') : '';
    return `cache:${apiId}:${cleanPath}:${queryString}`;
}

/**
 * Retrieves a cached HTTP response payload from Redis.
 */
async function getCachedResponse(apiId, path, query) {
    if (!isRedisConnected()) return null;

    try {
        const cacheKey = buildCacheKey(apiId, path, query);
        const data = await redis.get(cacheKey);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn('[Cache Warning] Failed to get cache:', error.message);
    }
    return null;
}

/**
 * Stores an HTTP response payload into Redis with a TTL.
 */
async function setCachedResponse(apiId, path, query, payload, ttlSeconds = DEFAULT_TTL) {
    if (!isRedisConnected()) return;

    try {
        const cacheKey = buildCacheKey(apiId, path, query);
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', ttlSeconds);
    } catch (error) {
        console.warn('[Cache Warning] Failed to set cache:', error.message);
    }
}

export default {
    getCachedResponse,
    setCachedResponse
};
