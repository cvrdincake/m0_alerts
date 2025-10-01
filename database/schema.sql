-- ==================================
-- PostgreSQL Database Schema
-- ==================================

-- Users table (streamers)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    twitch_id VARCHAR(255) UNIQUE,
    youtube_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth tokens table
CREATE TABLE oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'twitch', 'youtube', 'streamlabs'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- Alert history table
CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2),
    message TEXT,
    metadata JSONB, -- Store additional data like months, bits, viewers, etc.
    platform VARCHAR(50), -- 'twitch', 'youtube', 'streamlabs'
    displayed BOOLEAN DEFAULT FALSE,
    displayed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_alert_type (alert_type),
    INDEX idx_displayed (displayed)
);

-- Alert customizations table
CREATE TABLE alert_customizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    duration INTEGER DEFAULT 5000, -- milliseconds
    animation VARCHAR(50) DEFAULT 'bounce',
    primary_color VARCHAR(7) DEFAULT '#8b5cf6',
    secondary_color VARCHAR(7) DEFAULT '#6366f1',
    accent_color VARCHAR(7) DEFAULT '#a78bfa',
    sound_url TEXT,
    volume INTEGER DEFAULT 80,
    custom_template JSONB, -- Store title, message, subtitle templates
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, alert_type)
);

-- Goals table (follower/sub goals)
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'followers', 'subscribers', 'donations'
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_active (user_id, completed)
);

-- Statistics table
CREATE TABLE statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    followers_gained INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    total_donations DECIMAL(10, 2) DEFAULT 0,
    total_bits INTEGER DEFAULT 0,
    raids_received INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    stream_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    INDEX idx_user_date (user_id, date DESC)
);

-- Settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    master_volume INTEGER DEFAULT 80,
    enable_tts BOOLEAN DEFAULT FALSE,
    queue_delay INTEGER DEFAULT 500,
    show_test_alerts BOOLEAN DEFAULT TRUE,
    min_donation_amount DECIMAL(10, 2) DEFAULT 1.00,
    min_cheer_amount INTEGER DEFAULT 100,
    profanity_filter BOOLEAN DEFAULT TRUE,
    notification_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert queue table (for persistence)
CREATE TABLE alert_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    priority INTEGER DEFAULT 0, -- Higher priority shown first
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unprocessed (user_id, processed, priority DESC, created_at ASC)
);

-- Blacklist table (blocked users)
CREATE TABLE blacklist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blocked_username VARCHAR(255) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_username)
);

-- Webhook subscriptions table (track active subscriptions)
CREATE TABLE webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    subscription_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_platform_status (platform, status)
);

-- ==================================
-- Indexes for Performance
-- ==================================

CREATE INDEX idx_alert_history_timestamp ON alert_history(created_at DESC);
CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_statistics_date ON statistics(date DESC);
CREATE INDEX idx_goals_completion ON goals(completed, end_date);

-- ==================================
-- Views for Common Queries
-- ==================================

-- Recent alerts view
CREATE VIEW recent_alerts AS
SELECT 
    ah.id,
    u.username as streamer,
    ah.alert_type,
    ah.username as viewer,
    ah.amount,
    ah.message,
    ah.platform,
    ah.created_at
FROM alert_history ah
JOIN users u ON ah.user_id = u.id
ORDER BY ah.created_at DESC
LIMIT 100;

-- Daily statistics view
CREATE VIEW daily_stats AS
SELECT 
    u.username,
    s.date,
    s.followers_gained,
    s.subscribers_gained,
    s.total_donations,
    s.total_bits,
    s.raids_received
FROM statistics s
JOIN users u ON s.user_id = u.id
ORDER BY s.date DESC;

-- Active goals view
CREATE VIEW active_goals AS
SELECT 
    u.username,
    g.goal_type,
    g.title,
    g.current_amount,
    g.target_amount,
    ROUND((g.current_amount::DECIMAL / g.target_amount * 100), 2) as progress_percent,
    g.end_date
FROM goals g
JOIN users u ON g.user_id = u.id
WHERE g.completed = FALSE
ORDER BY g.end_date ASC;

-- ==================================
-- Functions
-- ==================================

-- Update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update follower goals
    IF NEW.alert_type = 'follow' THEN
        UPDATE goals 
        SET current_amount = current_amount + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id 
        AND goal_type = 'followers' 
        AND completed = FALSE;
    END IF;
    
    -- Update subscriber goals
    IF NEW.alert_type IN ('subscribe', 'giftsub') THEN
        UPDATE goals 
        SET current_amount = current_amount + COALESCE((NEW.metadata->>'count')::INTEGER, 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id 
        AND goal_type = 'subscribers' 
        AND completed = FALSE;
    END IF;
    
    -- Update donation goals
    IF NEW.alert_type IN ('donation', 'superchat', 'tip') AND NEW.amount IS NOT NULL THEN
        UPDATE goals 
        SET current_amount = current_amount + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id 
        AND goal_type = 'donations' 
        AND completed = FALSE;
    END IF;
    
    -- Check if any goals are completed
    UPDATE goals
    SET completed = TRUE,
        completed_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id
    AND current_amount >= target_amount
    AND completed = FALSE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goals
CREATE TRIGGER trigger_update_goals
AFTER INSERT ON alert_history
FOR EACH ROW
EXECUTE FUNCTION update_goal_progress();

-- Update daily statistics
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    -- Ensure row exists for today
    INSERT INTO statistics (user_id, date)
    VALUES (NEW.user_id, today)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    -- Update followers
    IF NEW.alert_type = 'follow' THEN
        UPDATE statistics 
        SET followers_gained = followers_gained + 1
        WHERE user_id = NEW.user_id AND date = today;
    END IF;
    
    -- Update subscribers
    IF NEW.alert_type IN ('subscribe', 'giftsub') THEN
        UPDATE statistics 
        SET subscribers_gained = subscribers_gained + COALESCE((NEW.metadata->>'count')::INTEGER, 1)
        WHERE user_id = NEW.user_id AND date = today;
    END IF;
    
    -- Update donations
    IF NEW.alert_type IN ('donation', 'superchat', 'tip') AND NEW.amount IS NOT NULL THEN
        UPDATE statistics 
        SET total_donations = total_donations + NEW.amount
        WHERE user_id = NEW.user_id AND date = today;
    END IF;
    
    -- Update bits
    IF NEW.alert_type = 'cheer' THEN
        UPDATE statistics 
        SET total_bits = total_bits + (NEW.metadata->>'bits')::INTEGER
        WHERE user_id = NEW.user_id AND date = today;
    END IF;
    
    -- Update raids
    IF NEW.alert_type = 'raid' THEN
        UPDATE statistics 
        SET raids_received = raids_received + 1
        WHERE user_id = NEW.user_id AND date = today;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics
CREATE TRIGGER trigger_update_stats
AFTER INSERT ON alert_history
FOR EACH ROW
EXECUTE FUNCTION update_daily_stats();

-- ==================================
-- Sample Data
-- ==================================

-- Insert test user
INSERT INTO users (username, email) 
VALUES ('demo_streamer', 'demo@example.com');

-- Insert default customizations
INSERT INTO alert_customizations (user_id, alert_type, duration, animation)
SELECT 1, alert_type, 5000, 'bounce'
FROM (VALUES 
    ('follow'), ('subscribe'), ('donation'), ('raid'),
    ('cheer'), ('giftsub'), ('member'), ('superchat')
) AS t(alert_type);

-- Insert default settings
INSERT INTO settings (user_id) VALUES (1);

-- Insert sample goal
INSERT INTO goals (user_id, goal_type, target_amount, title)
VALUES (1, 'followers', 1000, '1K Followers Goal');

-- ==================================
-- Cleanup Queries
-- ==================================

-- Delete old alert history (older than 90 days)
DELETE FROM alert_history 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Delete expired webhook subscriptions
DELETE FROM webhook_subscriptions 
WHERE expires_at < CURRENT_TIMESTAMP;

-- Archive old statistics (move to separate table)
CREATE TABLE statistics_archive AS 
SELECT * FROM statistics 
WHERE date < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM statistics 
WHERE date < CURRENT_DATE - INTERVAL '1 year';

-- ==================================
-- Performance Monitoring Queries
-- ==================================

-- Most active streamers
SELECT 
    u.username,
    COUNT(*) as total_alerts,
    COUNT(DISTINCT DATE(ah.created_at)) as active_days
FROM alert_history ah
JOIN users u ON ah.user_id = u.id
WHERE ah.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY u.username
ORDER BY total_alerts DESC
LIMIT 10;

-- Alert type distribution
SELECT 
    alert_type,
    COUNT(*) as count,
    ROUND(AVG(amount), 2) as avg_amount
FROM alert_history
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY alert_type
ORDER BY count DESC;

-- Top donors
SELECT 
    username,
    SUM(amount) as total_donated,
    COUNT(*) as donation_count
FROM alert_history
WHERE alert_type IN ('donation', 'superchat', 'tip')
AND amount IS NOT NULL
GROUP BY username
ORDER BY total_donated DESC
LIMIT 10;
