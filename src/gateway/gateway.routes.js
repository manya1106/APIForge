import express from 'express';
import authService from '../auth/auth.service.js';
import registryService from '../registry/registry.service.js';
import cacheService from '../cache/cache.service.js';
import ratelimitService from '../auth/ratelimit.service.js';
import loggingService from '../analytics/logging.service.js';

const router = express.Router();

// Intercept all HTTP methods matching /gateway/:apiId/*
router.all('/:apiId/*rest', async (req, res, next) => {
    const startTime = Date.now();
    const { apiId } = req.params;
    const path = req.params[0] || '';
    const apiKey = req.headers['x-api-key'];

    let statusCode = 500;

    const recordLog = (code) => {
        const latencyMs = Date.now() - startTime;
        loggingService.logRequest({
            apiId,
            path: `/${path}`,
            method: req.method,
            statusCode: code,
            latencyMs
        });
    };

    try {
        // 1. Security Check
        if (!apiKey) {
            statusCode = 401;
            recordLog(statusCode);
            return res.status(401).json({ error: "Missing x-api-key header" });
        }

        const isValid = await authService.validateApiKey(apiId, apiKey);
        if (!isValid) {
            statusCode = 403;
            recordLog(statusCode);
            return res.status(403).json({ error: "Invalid or inactive API key" });
        }

        // 2. Rate Limiting Check
        const rateLimit = await ratelimitService.checkRateLimit(apiKey);
        res.setHeader('X-RateLimit-Limit', rateLimit.limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit.limit - rateLimit.current));
        res.setHeader('X-RateLimit-Reset', rateLimit.resetSeconds);

        if (!rateLimit.allowed) {
            statusCode = 429;
            res.setHeader('Retry-After', rateLimit.resetSeconds);
            recordLog(statusCode);
            return res.status(429).json({
                error: "Too Many Requests",
                message: `Rate limit exceeded. Try again in ${rateLimit.resetSeconds} seconds.`
            });
        }

        // 3. Registry Lookup Check
        const apiConfig = await registryService.getApiById(apiId);
        if (!apiConfig) {
            statusCode = 404;
            recordLog(statusCode);
            return res.status(404).json({ error: "API not found in registry" });
        }

        // 4. Response Caching Check (GET requests only)
        if (req.method === 'GET') {
            const cached = await cacheService.getCachedResponse(apiId, path, req.query);
            if (cached) {
                res.setHeader('X-Cache', 'HIT');
                recordLog(cached.status || 200);
                return res.status(cached.status || 200).json(cached.body);
            }
        }

        // 5. Construct Target URL
        const searchParams = new URLSearchParams(req.query).toString();
        const queryString = searchParams ? `?${searchParams}` : '';
        const targetUrl = `${apiConfig.target_url}/${path}${queryString}`;

        // 6. Proxy Request
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            }
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const upstreamResponse = await fetch(targetUrl, fetchOptions);
        statusCode = upstreamResponse.status;

        let responseBody;
        const contentType = upstreamResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            responseBody = await upstreamResponse.json();
        } else {
            const rawText = await upstreamResponse.text();
            try {
                responseBody = JSON.parse(rawText);
            } catch {
                responseBody = { data: rawText };
            }
        }

        // 7. Store in Cache (Only successful GET requests)
        if (req.method === 'GET' && statusCode >= 200 && statusCode < 300) {
            res.setHeader('X-Cache', 'MISS');
            await cacheService.setCachedResponse(apiId, path, req.query, {
                status: statusCode,
                body: responseBody
            });
        } else {
            res.setHeader('X-Cache', 'BYPASS');
        }

        // 8. Record Analytics Log & Return Response
        recordLog(statusCode);
        return res.status(statusCode).json(responseBody);

    } catch (error) {
        console.error('[Gateway Error]', error.message);
        statusCode = 500;
        recordLog(statusCode);
        return res.status(500).json({ error: "Gateway Internal Error", details: error.message });
    }
});

export default router;