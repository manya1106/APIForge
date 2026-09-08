import db from '../db/index.js';

async function getSummary(apiId) {
    const [rows] = await db.query(
        `SELECT 
            COUNT(*) AS totalRequests,
            COALESCE(AVG(latency_ms), 0) AS avgLatencyMs,
            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS totalErrors
         FROM request_logs 
         WHERE api_id = ?`,
        [apiId]
    );

    const stats = rows[0];
    const totalRequests = Number(stats.totalRequests || 0);
    const avgLatencyMs = Math.round(Number(stats.avgLatencyMs || 0));
    const totalErrors = Number(stats.totalErrors || 0);
    const errorRatePercent = totalRequests > 0 
        ? parseFloat(((totalErrors / totalRequests) * 100).toFixed(2)) 
        : 0;

    return {
        apiId,
        totalRequests,
        avgLatencyMs,
        totalErrors,
        errorRatePercent
    };
}

async function getTimeseries(apiId) {
    const [rows] = await db.query(
        `SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') AS hourBucket,
            COUNT(*) AS totalRequests,
            ROUND(AVG(latency_ms)) AS avgLatencyMs,
            SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errorCount
         FROM request_logs 
         WHERE api_id = ? AND created_at >= NOW() - INTERVAL 24 HOUR
         GROUP BY hourBucket
         ORDER BY hourBucket ASC`,
        [apiId]
    );

    return rows.map(r => ({
        hour: r.hourBucket,
        totalRequests: Number(r.totalRequests),
        avgLatencyMs: Number(r.avgLatencyMs || 0),
        errorCount: Number(r.errorCount || 0)
    }));
}

async function getErrors(apiId) {
    const [rows] = await db.query(
        `SELECT 
            id, path, method, status_code AS statusCode, latency_ms AS latencyMs, created_at AS createdAt
         FROM request_logs 
         WHERE api_id = ? AND status_code >= 400
         ORDER BY created_at DESC
         LIMIT 50`,
        [apiId]
    );

    return rows;
}

export default {
    getSummary,
    getTimeseries,
    getErrors
};
