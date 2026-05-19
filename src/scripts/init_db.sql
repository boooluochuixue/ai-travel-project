-- Travel Planner Database Initialization
-- This script is executed by the MySQL container on first startup

-- Migration for existing databases (run if upgrading):
-- ALTER TABLE itinerary_days ADD COLUMN hotel JSON DEFAULT NULL COMMENT 'Hotel recommendation: {name, address, rating, price_level, cost_per_night, room_type, note}' AFTER weather_forecast;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nickname    VARCHAR(64)     NOT NULL DEFAULT '',
    avatar      VARCHAR(512)    NOT NULL DEFAULT '',
    email       VARCHAR(128)    NOT NULL DEFAULT '',
    phone       VARCHAR(20)     NOT NULL DEFAULT '',
    preferences JSON            COMMENT 'User preferences',
    status      TINYINT         NOT NULL DEFAULT 1 COMMENT '0-disabled 1-active',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(64)     NOT NULL COMMENT 'Chinese name',
    name_en     VARCHAR(128)    NOT NULL DEFAULT '',
    country     VARCHAR(64)     NOT NULL DEFAULT 'China',
    province    VARCHAR(64)     NOT NULL DEFAULT '',
    latitude    DECIMAL(10,7)   NOT NULL DEFAULT 0,
    longitude   DECIMAL(10,7)   NOT NULL DEFAULT 0,
    timezone    VARCHAR(32)     NOT NULL DEFAULT 'Asia/Shanghai',
    description TEXT,
    status      TINYINT         NOT NULL DEFAULT 1,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pois (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id         BIGINT          NOT NULL,
    name            VARCHAR(256)    NOT NULL,
    category        VARCHAR(32)     NOT NULL COMMENT 'attraction/restaurant/hotel/shopping/entertainment',
    sub_category    VARCHAR(64)     NOT NULL DEFAULT '',
    address         VARCHAR(512)    NOT NULL DEFAULT '',
    latitude        DECIMAL(10,7)   NOT NULL DEFAULT 0,
    longitude       DECIMAL(10,7)   NOT NULL DEFAULT 0,
    rating          DECIMAL(2,1)    NOT NULL DEFAULT 0 COMMENT 'Rating 1.0-5.0',
    price_level     TINYINT         NOT NULL DEFAULT 1 COMMENT '1-budget 2-moderate 3-luxury',
    opening_hours   VARCHAR(256)    NOT NULL DEFAULT '',
    visit_duration  INT             NOT NULL DEFAULT 120 COMMENT 'Suggested visit duration (minutes)',
    description     TEXT,
    image_url       VARCHAR(512)    NOT NULL DEFAULT '',
    status          TINYINT         NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city_id),
    INDEX idx_category (category),
    INDEX idx_city_cat (city_id, category),
    INDEX idx_rating (rating DESC),
    FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS itineraries (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT          DEFAULT NULL,
    title             VARCHAR(256)    NOT NULL DEFAULT '',
    destinations      JSON            NOT NULL COMMENT '[{city_id, city_name, days}]',
    start_date        DATE            DEFAULT NULL,
    end_date          DATE            DEFAULT NULL,
    total_budget      DECIMAL(12,2)   DEFAULT NULL COMMENT 'Total budget (CNY)',
    budget_breakdown  JSON            COMMENT 'Budget breakdown',
    preferences       JSON            COMMENT 'User preference snapshot',
    status            ENUM('draft','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
    raw_plan          LONGTEXT        COMMENT 'Raw agent-generated plan text',
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS itinerary_days (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id      BIGINT          NOT NULL,
    day_number        INT             NOT NULL COMMENT 'Day number (starting from 1)',
    date              DATE            DEFAULT NULL,
    weather_forecast  JSON            COMMENT 'Weather data',
    hotel             JSON            DEFAULT NULL COMMENT 'Selected hotel: {name, address, rating, price_level, cost_per_night, room_type, note}',
    hotel_options     JSON            DEFAULT NULL COMMENT 'Multiple hotel choices: [{name, address, rating, price_level, cost_per_night, room_type, note}, ...]',
    notes             TEXT,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_itinerary (itinerary_id),
    INDEX idx_day_num (itinerary_id, day_number),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS itinerary_slots (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    day_id            BIGINT          NOT NULL,
    slot_type         ENUM('morning','afternoon','evening') NOT NULL,
    poi_id            BIGINT          DEFAULT NULL COMMENT 'Related POI (optional)',
    poi_name          VARCHAR(256)    NOT NULL,
    poi_category      VARCHAR(32)     NOT NULL DEFAULT '',
    address           VARCHAR(512)    NOT NULL DEFAULT '',
    latitude          DECIMAL(10,7)   DEFAULT NULL,
    longitude         DECIMAL(10,7)   DEFAULT NULL,
    start_time        VARCHAR(16)     NOT NULL DEFAULT '' COMMENT 'e.g. 09:00',
    end_time          VARCHAR(16)     NOT NULL DEFAULT '' COMMENT 'e.g. 12:00',
    duration          INT             NOT NULL DEFAULT 120 COMMENT 'Duration (minutes)',
    transport_tip     VARCHAR(512)    NOT NULL DEFAULT '',
    cost              DECIMAL(10,2)   DEFAULT NULL,
    note              TEXT,
    sort_order        INT             NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_day (day_id),
    INDEX idx_day_order (day_id, sort_order),
    FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id    BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    rating          TINYINT         NOT NULL COMMENT '1-5 stars',
    content         TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_itinerary (itinerary_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
