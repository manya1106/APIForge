import express from 'express';
const router = express.Router();
import authService from '../auth/auth.service.js';
import registryService from '../registry/registry.service.js';

// The wildcard (*) captures the rest of the URL path
router.all('/:apiId/*rest', async (req, res, next) => {
    try {
        const { apiId } = req.params;
        const path = req.params[0]; 
        const apiKey = req.headers['x-api-key']; // Standard header for API keys

        // 1. Security Check
        if (!apiKey) {
            return res.status(401).json({ error: "Missing x-api-key header" });
        }

        const isValid = await authService.validateApiKey(apiId, apiKey);
        if (!isValid) {
            return res.status(403).json({ error: "Invalid or inactive API key" });
        }

        // 2. Routing Check
        const apiConfig = await registryService.getApiById(apiId);
        if (!apiConfig) {
            return res.status(404).json({ error: "API not found in registry" });
        }

        // 3. Construct the exact URL to forward to
        // This grabs any query params (like ?latitude=12.97) and appends them
        const searchParams = new URLSearchParams(req.query).toString();
        const queryString = searchParams ? `?${searchParams}` : '';
        const targetUrl = `${apiConfig.target_url}/${path}${queryString}`;

        // 4. Proxy the Request
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            }
        };

        // Only attach a body if it's not a GET request
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json(); 

        // 5. Send the third-party response back to the original client
        res.status(response.status).json(data);

    } catch (error) {
        next(error);
    }
});

export default router;