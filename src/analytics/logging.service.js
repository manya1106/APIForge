import db from '../db/index.js';

/**
 * Asynchronously logs gateway request details to MySQL request_logs table.
 * Designed to be fire-and-forget to avoid blocking client HTTP responses.
 */
async function logRequest({ apiId, path, method, statusCode, latencyMs }) {
    try {
        await db.query(
            'INSERT INTO request_logs (api_id, path, method, status_code, latency_ms) VALUES (?, ?, ?, ?, ?)',
            [apiId, path || '/', method, statusCode, latencyMs]
        );
    } catch (error) {
        console.error('[Logging Error] Failed to write request log:', error.message);
    }
}

export default {
    logRequest
};
