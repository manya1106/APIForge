import db from "../db/index.js"; 
import crypto from 'crypto'; 

async function generateApiKey(apiId) {
    // 1. Generate a cryptographically secure key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const prefix = 'apiforge_'; 
    const finalKey = prefix + rawKey;

    // 2. Hash it using SHA-256 for fast lookup in the gateway
    const hashedKey = crypto.createHash('sha256').update(finalKey).digest('hex');
    const keyId = crypto.randomUUID();

    // 3. Store only the hash
    await db.query(
        'INSERT INTO api_keys (id, api_id, api_key_hash) VALUES (?, ?, ?)',
        [keyId, apiId, hashedKey]
    );

    // 4. Return the raw key (the controller will send this to the user exactly once)
    return { 
        keyId, 
        apiKey: finalKey, 
        message: "Store this key safely. You will not be able to see it again." 
    };
}

async function validateApiKey(apiId, providedKey) {
    // Hash the provided key to compare with the DB
    const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
    
    const [rows] = await db.query(
        'SELECT id FROM api_keys WHERE api_id = ? AND api_key_hash = ? AND is_active = TRUE',
        [apiId, hashedKey]
    );
    
    return rows.length > 0;
}

export default { generateApiKey, validateApiKey };