import db from "../db/index.js";
import crypto from 'crypto'; // Built-in Node module for UUIDs

async function registerApi(userId, name, targetUrl) {
    const apiId = crypto.randomUUID();
    
    await db.query(
        'INSERT INTO managed_apis (id, user_id, name, target_url) VALUES (?, ?, ?, ?)',
        [apiId, userId, name, targetUrl]
    );
    
    return { apiId, userId, name, targetUrl };
}

async function getApiById(apiId) {
    const [rows] = await db.query(
        'SELECT target_url FROM managed_apis WHERE id = ?',
        [apiId]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Update your module.exports:
export default { registerApi, getApiById };