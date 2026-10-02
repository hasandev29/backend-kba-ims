CREATE TABLE academic_terms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,

    name VARCHAR(150) NOT NULL,

    term_type ENUM('ODD', 'EVEN') NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_academic_term_course_name (course_id, name),
KEY idx_academic_term_dates (start_date, end_date),
KEY idx_academic_term_course_active
    (course_id, is_active),

KEY idx_academic_term_course_current
    (course_id, is_current),

CONSTRAINT fk_academic_term_course
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON UPDATE CASCADE
ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;