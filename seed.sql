-- Drop tables if they exist
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS item_images;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS favorites;
SET FOREIGN_KEY_CHECKS = 1;

-- Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items Table
CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'SOLD', 'REMOVED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id BIGINT,
    owner_id BIGINT,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Images Table
CREATE TABLE item_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(512) NOT NULL,
    item_id BIGINT,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements Table
CREATE TABLE announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('NOTICE', 'PROMOTION') DEFAULT 'NOTICE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites Table
CREATE TABLE favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    item_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
-- Passwords are BCrypt for 'password123'
INSERT INTO users (username, password, email, role) VALUES 
('admin', '$2a$10$r96Mv1B1T0fX1W9BfP0X.uP9LzFz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9', 'admin@oldnewhub.com', 'ADMIN'),
('user1', '$2a$10$r96Mv1B1T0fX1W9BfP0X.uP9LzFz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9', 'user1@example.com', 'USER'),
('user2', '$2a$10$r96Mv1B1T0fX1W9BfP0X.uP9LzFz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9Fz9', 'user2@example.com', 'USER');

INSERT INTO categories (name) VALUES 
('图书'), ('电子产品'), ('生活用品'), ('运动器材'), ('其它');

INSERT INTO items (title, description, price, status, category_id, owner_id) VALUES 
('Java编程思想', '经典Java教程，9成新', 45.00, 'APPROVED', 1, 2),
('二手MacBook Pro', '2021款，16G内存，成色极好', 6500.00, 'PENDING', 2, 3),
('校园单车', '毕业出，带锁和充气筒', 120.00, 'PENDING', 3, 2),
('雅思真题', '一套雅思真题，有笔记', 30.00, 'PENDING', 1, 3);

INSERT INTO item_images (image_url, item_id) VALUES 
('/Assets/2/1/book.jpg', 1),
('/Assets/3/2/mac.jpg', 2),
('/Assets/2/3/bike.jpg', 3);

INSERT INTO announcements (title, content, type) VALUES 
('欢迎来到 OldNewHub', '我们致力于打造最安全的校园二手交易平台。', 'NOTICE'),
('毕业季特惠', '毕业季期间发布闲置有惊喜！', 'PROMOTION');
