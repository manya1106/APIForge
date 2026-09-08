import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redis = new Redis({
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        // Exponential backoff with a cap of 2000ms
        const delay = Math.min(times * 100, 2000);
        return delay;
    }
});

let isConnected = false;

redis.on('connect', () => {
    isConnected = true;
    console.log(`[Redis] Connected to Redis at ${redisHost}:${redisPort}`);
});

redis.on('error', (err) => {
    isConnected = false;
    console.warn(`[Redis Warning] Redis connection issue: ${err.message}`);
});

export function isRedisConnected() {
    return isConnected;
}

// Attempt initial connection asynchronously without blocking server start
redis.connect().catch((err) => {
    console.warn(`[Redis Warning] Could not perform initial connect: ${err.message}`);
});

export default redis;
