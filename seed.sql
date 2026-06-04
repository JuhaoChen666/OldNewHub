-- Create Database
CREATE DATABASE IF NOT EXISTS oldnewhub;
USE oldnewhub;

-- Drop tables if they exist
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS item_images;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS announcements;
SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items Table
CREATE TABLE items (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'SOLD', 'REMOVED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id BIGINT,
    user_id BIGINT,
    price_change_reason TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Images Table
CREATE TABLE item_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(512) NOT NULL,
    item_id BIGINT,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements Table
CREATE TABLE announcements (
    announcement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('NOTICE', 'RECOMMEND') DEFAULT 'NOTICE',
    priority INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites Table
CREATE TABLE favorites (
    favorite_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    item_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
-- Passwords are BCrypt for 'password123'
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2a$10$aVQS238pKsWlYO6jUImo7exptFJmUqYy.CFoKtCIH3Yun10K76tDK', 'admin@oldnewhub.com', 'ADMIN'),
('user1', '$2a$10$aVQS238pKsWlYO6jUImo7exptFJmUqYy.CFoKtCIH3Yun10K76tDK', 'user1@example.com', 'USER'),
('user2', '$2a$10$aVQS238pKsWlYO6jUImo7exptFJmUqYy.CFoKtCIH3Yun10K76tDK', 'user2@example.com', 'USER');

INSERT INTO categories (name) VALUES
('图书'), ('电子产品'), ('生活用品'), ('运动器材'), ('其它');

INSERT INTO items (title, description, price, status, category_id, user_id) VALUES
('Java编程思想', '经典Java教程，9成新', 45.00, 'APPROVED', 1, 2),
('二手MacBook Pro', '2021款，16G内存，成色极好', 6500.00, 'PENDING', 2, 3),
('校园单车', '毕业出，带锁和充气筒', 120.00, 'PENDING', 3, 2),
('雅思真题', '一套雅思真题，有笔记', 30.00, 'PENDING', 1, 3);

INSERT INTO announcements (title, content, type) VALUES
('欢迎来到 OldNewHub', '我们致力于打造最安全的校园二手交易平台。', 'NOTICE'),
('毕业季特惠', '毕业季期间发布闲置有惊喜！', 'RECOMMEND');
