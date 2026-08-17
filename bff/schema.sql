-- 醒醺 V6 MySQL Schema v2（2026-08-17 数据治理后重写）
-- 数据规模：147 款 = 经典咖啡 45 + IBA 官方鸡尾酒 102
-- 变更记录：
--   v2 清理 taxonomy 死数据（旧 384 款时代的 219 行 -> 固定字典 60 行，与 BFF 筛选字典一致）
--   v2 时间列 VARCHAR(16) -> VARCHAR(19)（完整 ISO 时间戳，消除 1406 截断）
--   v2 去掉 drink_similar 冗余索引（PK 已覆盖）
-- 由 container.config.json executeSQLs 自动执行（云端）

CREATE DATABASE IF NOT EXISTS awakeaglow;
USE awakeaglow;

-- 产品主表（147 条：咖啡 45 + 鸡尾酒 102）
CREATE TABLE IF NOT EXISTS `drink` (
    `id`                     VARCHAR(64)  NOT NULL COMMENT '产品 code（drinkId）',
    `mode`                   VARCHAR(16)  NOT NULL COMMENT 'coffee|cocktail',
    `category`               VARCHAR(16)  NOT NULL COMMENT 'COFFEE|COCKTAIL',
    `name_zh`                VARCHAR(128) NOT NULL COMMENT '中文名',
    `name_en`                VARCHAR(128) NOT NULL COMMENT '英文官方名',
    `name_pinyin`            VARCHAR(256) NOT NULL DEFAULT '' COMMENT '中文拼音全拼',
    `name_pinyin_initials`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '拼音首字母',
    `intro`                  TEXT         NOT NULL COMMENT '一句话简介',
    `description`            TEXT         NOT NULL COMMENT '详细描述（含背景故事）',
    `image_url`              VARCHAR(512) NOT NULL COMMENT '列表图（IBA 官网/wikimedia）',
    `poster_url`             VARCHAR(512) NOT NULL COMMENT '海报图（同 image_url 或本地）',
    `recommendation_score`   INT          NOT NULL DEFAULT 0 COMMENT '推荐指数 0-100',
    `sort_order`             INT          NOT NULL DEFAULT 0 COMMENT '展示排序',
    `radar_json`             TEXT         NOT NULL COMMENT '雷达 6 维 {key,label,score}',
    `tags_json`              TEXT         NOT NULL COMMENT '标签数组',
    `scene_json`             TEXT         NOT NULL COMMENT '场景数组（日常/下午茶/开胃…）',
    `attributes_json`        TEXT         NOT NULL COMMENT '筛选属性 {coffeeType,milk,…}',
    `ingredients_json`       TEXT         NOT NULL COMMENT '配方成分 [{nameZh,nameEn,amount,unit,role}]',
    `steps_json`             TEXT         NOT NULL COMMENT '制作步骤数组',
    `aliases_json`           TEXT         NOT NULL DEFAULT ('[]') COMMENT '别名数组',
    `source_level`           VARCHAR(4)   NOT NULL DEFAULT 'B' COMMENT '来源等级 A-E',
    `updated_at`             VARCHAR(19)  NOT NULL COMMENT 'ISO 时间戳 YYYY-MM-DDTHH:MM:SS',
    `reviewed`               TINYINT      NOT NULL DEFAULT 1 COMMENT '审核通过',
    `card_json`              MEDIUMTEXT   NOT NULL COMMENT '列表卡片物化摘要',
    PRIMARY KEY (`id`),
    INDEX `idx_drink_mode_sort` (`mode`, `sort_order`),
    FULLTEXT INDEX `idx_drink_search` (`name_zh`, `name_en`, `intro`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 筛选字典（固定字典：与 BFF FIXED_TAXONOMY 逐字一致；咖啡 5 组 26 项 + 鸡尾酒 5 组 34 项 = 60 行）
-- 选项 value 为用户可见中文（菜单/偏好面板直接展示）；提交筛选时经 BFF 映射到 drink.attributes_json 值域
CREATE TABLE IF NOT EXISTS `taxonomy` (
    `mode`          VARCHAR(16)  NOT NULL COMMENT 'coffee|cocktail',
    `group_key`     VARCHAR(32)  NOT NULL COMMENT '分组键（对应 attributes 键）',
    `group_label`   VARCHAR(32)  NOT NULL COMMENT '分组中文名',
    `option_value`  VARCHAR(64)  NOT NULL COMMENT '选项值（=选项中文名）',
    `option_label`  VARCHAR(64)  NOT NULL COMMENT '选项中文名',
    `sort_order`    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (`mode`, `group_key`, `option_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 相似产品预计算（每产品 Top-10，similarity-1 规则）
CREATE TABLE IF NOT EXISTS `drink_similar` (
    `drink_id`   VARCHAR(64) NOT NULL,
    `similar_id` VARCHAR(64) NOT NULL,
    `rank`       INT         NOT NULL,
    `score`      FLOAT       NOT NULL,
    PRIMARY KEY (`drink_id`, `rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 元数据（release_code / 计数）
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
    `updated_at`                VARCHAR(19),
    PRIMARY KEY (`install_identity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏
CREATE TABLE IF NOT EXISTS `user_favorite` (
    `install_identity` VARCHAR(64)  NOT NULL,
    `drink_id`         VARCHAR(64)  NOT NULL,
    `created_at`       VARCHAR(19)  NOT NULL,
    PRIMARY KEY (`install_identity`, `drink_id`),
    INDEX `idx_fav_identity` (`install_identity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 浏览历史
CREATE TABLE IF NOT EXISTS `user_history` (
    `install_identity` VARCHAR(64)  NOT NULL,
    `drink_id`         VARCHAR(64)  NOT NULL,
    `viewed_at`        VARCHAR(19)  NOT NULL,
    PRIMARY KEY (`install_identity`, `drink_id`),
    INDEX `idx_hist_identity` (`install_identity`, `viewed_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
