-- Sub-Store Cloudflare D1 Database Schema
-- 用于初始化 Cloudflare D1 数据库

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 配置表
CREATE TABLE IF NOT EXISTS configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE IF NOT EXISTS files (
    name TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_at ON subscriptions(updated_at);
CREATE INDEX IF NOT EXISTS idx_configs_updated_at ON configs(updated_at);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON files(updated_at);

-- 插入默认配置
INSERT OR IGNORE INTO configs (key, value) VALUES 
('app_settings', '{"theme":"dark","language":"zh-CN","autoSync":true}'),
('backend_settings', '{"syncCron":"0 1 * * *","maxRetries":3,"timeout":30000}');
