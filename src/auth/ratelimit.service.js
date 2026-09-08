import redis, { isRedisConnected } from '../cache/redis.client.js';

const DEFAULT_LIMIT = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const DEFAULT_WINDOW_SEC = parseInt(process.env.RATE_LIMIT_WINDOW_SEC || '60', 10);

/**
 * Atomic fixed-window rate limiter using Redis pipelines.
 * Key structure: ratelimit:<apiKey>:<windowBucket>
 */
async function checkRateLimit(apiKey, limit = DEFAULT_LIMIT, windowSeconds = DEFAULT_WINDOW_SEC) {
    if (!isRedisConnected()) {
        // Fail-open if Redis is unavailable
        return { allowed: true, current: 0, limit, resetSeconds: windowSeconds };
    }

    try {
        const windowBucket = Math.floor(Date.now() / (windowSeconds * 1000));
        const key = `ratelimit:${apiKey}:${windowBucket}`;

        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.ttl(key);
        
        const results = await pipeline.exec();
        const currentCount = results[0][1];
        let ttl = results[1][1];

        // If newly created key (ttl == -1), set the expiration
        if (ttl < 0) {
            await redis.expire(key, windowSeconds);
            ttl = windowSeconds;
        }

        const allowed = currentCount <= limit;
        return {
            allowed,
            current: currentCount,
            limit,
            resetSeconds: ttl > 0 ? ttl : windowSeconds
        };
    } catch (error) {
        console.warn('[Rate Limit Warning] Error executing rate limit check:', error.message);
        // Fail open to preserve API availability
        return { allowed: true, current: 0, limit, resetSeconds: windowSeconds };
    }
}

export default {
    checkRateLimit
};
