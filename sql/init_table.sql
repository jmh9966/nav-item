-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除表
DROP TABLE IF EXISTS `cards`;
DROP TABLE IF EXISTS `sub_menus`;
DROP TABLE IF EXISTS `ads`;
DROP TABLE IF EXISTS `friends`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `menus`;

-- 创建 menus 表
CREATE TABLE `menus` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `order` int DEFAULT '0' COMMENT '显示顺序',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_menus_order` (`order`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建 users 表
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `last_login_time` datetime DEFAULT NULL,
  `last_login_ip` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建 ads 表
CREATE TABLE `ads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `position` varchar(50) NOT NULL COMMENT '广告位名称',
  `img` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ads_position` (`position`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建 friends 表
CREATE TABLE `friends` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_friends_title` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建 sub_menus 表
CREATE TABLE `sub_menus` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `parent_id` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  `order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_sub_menus_parent_id` (`parent_id`),
  KEY `idx_sub_menus_order` (`order`),
  CONSTRAINT `sub_menus_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 创建 cards 表
CREATE TABLE `cards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `menu_id` bigint DEFAULT NULL,
  `sub_menu_id` bigint DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `custom_logo_path` varchar(255) DEFAULT NULL,
  `desc` text COMMENT '卡片描述',
  `order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_cards_menu_id` (`menu_id`),
  KEY `idx_cards_sub_menu_id` (`sub_menu_id`),
  KEY `idx_cards_order` (`order`),
  CONSTRAINT `cards_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cards_ibfk_2` FOREIGN KEY (`sub_menu_id`) REFERENCES `sub_menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;