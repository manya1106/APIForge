CREATE TABLE IF NOT EXISTS managed_apis (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_url VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(36) PRIMARY KEY,
    api_id VARCHAR(36) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_id) REFERENCES managed_apis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS request_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_id VARCHAR(36) NOT NULL,
    path VARCHAR(1024) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    latency_ms INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_id (api_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (api_id) REFERENCES managed_apis(id) ON DELETE CASCADE
);
