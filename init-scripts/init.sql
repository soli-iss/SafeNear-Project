CREATE TABLE IF NOT EXISTS `shelters` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(20) UNIQUE,
  `open` boolean DEFAULT false COMMENT 'true for open',
  `location` varchar(255) NOT NULL,
  `map_id` integer NOT NULL,
  `x` INT DEFAULT NULL COMMENT 'X position on map image (0-10000 = 0-100%)',
  `y` INT DEFAULT NULL COMMENT 'Y position on map image (0-10000 = 0-100%)'
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `username` varchar(20) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `admin` boolean DEFAULT false COMMENT 'true for admin',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `maps` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(20) UNIQUE,
  `path` varchar(255) UNIQUE NOT NULL
);

ALTER TABLE `shelters` ADD FOREIGN KEY (`map_id`) REFERENCES `maps` (`id`);

INSERT INTO users (username, password, admin) VALUES ('admin', 'admin123', true);

CREATE TABLE IF NOT EXISTS `logs` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
