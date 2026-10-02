CREATE TABLE IF NOT EXISTS users (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id    VARCHAR(50)     NOT NULL,
    email      VARCHAR(255)    NULL,
    role       ENUM('superadmin','admin','staff','student','parent','dev','accountant') NOT NULL, 
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    password   VARCHAR(255)    NOT NULL,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id),
    UNIQUE KEY uq_user_id (user_id),
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remember Me Tokens Table
CREATE TABLE IF NOT EXISTS user_remember_tokens (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED    NOT NULL,
    token      VARCHAR(64)     NOT NULL,
    expires_at DATETIME        NOT NULL,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_token (token),
    KEY        idx_user_id (user_id),
    CONSTRAINT fk_remember_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
