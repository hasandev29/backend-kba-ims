CREATE TABLE batches (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id     INT UNSIGNED NOT NULL,
    batch_name    VARCHAR(100) NOT NULL UNIQUE,
    start_year    YEAR NOT NULL,
    end_year      YEAR NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_batches_course_id (course_id),
    KEY idx_batches_start_year (start_year),
    KEY idx_batches_end_year (end_year),

    CONSTRAINT fk_batches_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO batches
(course, batch_name, start_year, end_year)
VALUES
('KBA', '2021 Batch', 2021, 2026),
('KBA', '2022 Batch', 2022, 2027),
('Arabic Diploma', '2023 - 2024 Batch', 2023, 2024);