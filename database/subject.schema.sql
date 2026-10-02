CREATE TABLE IF NOT EXISTS subjects (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50) NULL,
    display_name VARCHAR(150) NULL,
    book_name VARCHAR(200) NULL,
    description TEXT NULL,
    course INT UNSIGNED NOT NULL,
    semester INT UNSIGNED NULL,
    term INT UNSIGNED NOT NULL,
    credits DECIMAL(4,1) NULL,
    univ_credits DECIMAL(4,1) NULL,
    classroom_id INT UNSIGNED NULL,
    course_staff_id INT UNSIGNED NULL,
    handling_staff_id INT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_subject_code (code),

    INDEX idx_course (course),
    INDEX idx_term (term),
    INDEX idx_semester (semester),
    INDEX idx_classroom_id (classroom_id),
    INDEX idx_is_active (is_active),

    CONSTRAINT fk_subjects_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_subjects_semester
    CHECK (semester IS NULL OR semester BETWEEN 1 AND 12),
    CONSTRAINT chk_subjects_term
        CHECK (term IN (1, 2))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;