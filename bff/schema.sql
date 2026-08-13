-- 醒醺 V6 MySQL Schema（微信云托管 Serverless MySQL）
-- 由 container.config.json executeSQLs 自动执行
-- 对齐 SQLite awakeaglow_v6_simple.db 6 表 + meta

CREATE DATABASE IF NOT EXISTS awakeaglow;
USE awakeaglow;

-- 产品主表（384 条：咖啡 130 + 鸡尾酒 254）
CREATE TABLE IF NOT EXISTS `drink` (
    `id`                     VARCHAR(64)  NOT NULL COMMENT '产品 code（drinkId）',
    `mode`                   VARCHAR(16)  NOT NULL COMMENT 'coffee|cocktail',
    `category`               VARCHAR(16)  NOT NULL COMMENT 'COFFEE|COCKTAIL',
    `name_zh`                VARCHAR(128) NOT NULL,
    `name_en`                VARCHAR(128) NOT NULL,
    `name_pinyin`            VARCHAR(256) NOT NULL DEFAULT '',
    `name_pinyin_initials`   VARCHAR(64)  NOT NULL DEFAULT '',
    `intro`                  TEXT         NOT NULL,
    `description`            TEXT         NOT NULL,
    `image_url`              VARCHAR(512) NOT NULL,
    `poster_url`             VARCHAR(512) NOT NULL,
    `recommendation_score`   INT          NOT NULL DEFAULT 0,
    `sort_order`             INT          NOT NULL DEFAULT 0,
    `radar_json`             TEXT         NOT NULL,
    `tags_json`              TEXT         NOT NULL,
    `scene_json`             TEXT         NOT NULL,
    `attributes_json`        TEXT         NOT NULL,
    `ingredients_json`       TEXT         NOT NULL,
    `steps_json`             TEXT         NOT NULL,
    `aliases_json`           TEXT         NOT NULL DEFAULT '[]',
    `source_level`           VARCHAR(4)   NOT NULL DEFAULT 'B',
    `updated_at`             VARCHAR(16)  NOT NULL,
    `reviewed`               TINYINT      NOT NULL DEFAULT 1,
    `card_json`              MEDIUMTEXT   NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_drink_mode_sort` (`mode`, `sort_order`),
    FULLTEXT INDEX `idx_drink_search` (`name_zh`, `name_en`, `intro`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 筛选字典（5 组 × ≤8 选项 × 2 模式）
CREATE TABLE IF NOT EXISTS `taxonomy` (
    `mode`          VARCHAR(16)  NOT NULL,
    `group_key`     VARCHAR(32)  NOT NULL,
    `group_label`   VARCHAR(32)  NOT NULL,
    `option_value`  VARCHAR(64)  NOT NULL,
    `option_label`  VARCHAR(64)  NOT NULL,
    `sort_order`    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`mode`, `group_key`, `option_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 相似产品预计算（每产品 Top-10）
CREATE TABLE IF NOT EXISTS `drink_similar` (
    `drink_id`   VARCHAR(64) NOT NULL,
    `similar_id` VARCHAR(64) NOT NULL,
    `rank`       INT         NOT NULL,
    `score`      FLOAT       NOT NULL,
    PRIMARY KEY (`drink_id`, `rank`),
    INDEX `idx_similar_drink` (`drink_id`, `rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 元数据（release_code / total_count）
CREATE TABLE IF NOT EXISTS `meta` (
    `key`   VARCHAR(32) NOT NULL,
    `value` VARCHAR(256) NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户档案（匿名安装身份关联）
CREATE TABLE IF NOT EXISTS `user_profile` (
    `install_identity`          VARCHAR(64)  NOT NULL,
    `display_name`              VARCHAR(64)  NOT NULL DEFAULT '',
    `avatar_url`                VARCHAR(512),
    `avatar_text`               VARCHAR(8),
    `coffee_preferences_json`   TEXT         NOT NULL,
    `cocktail_preferences_json` TEXT         NOT NULL,
    `updated_at`                VARCHAR(16),
    PRIMARY KEY (`install_identity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏
CREATE TABLE IF NOT EXISTS `user_favorite` (
    `install_identity` VARCHAR(64)  NOT NULL,
    `drink_id`         VARCHAR(64)  NOT NULL,
    `created_at`       VARCHAR(16)  NOT NULL,
    PRIMARY KEY (`install_identity`, `drink_id`),
    INDEX `idx_fav_identity` (`install_identity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 浏览历史
CREATE TABLE IF NOT EXISTS `user_history` (
    `install_identity` VARCHAR(64)  NOT NULL,
    `drink_id`         VARCHAR(64)  NOT NULL,
    `viewed_at`        VARCHAR(16)  NOT NULL,
    PRIMARY KEY (`install_identity`, `drink_id`),
    INDEX `idx_hist_identity` (`install_identity`, `viewed_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
