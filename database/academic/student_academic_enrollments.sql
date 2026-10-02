CREATE TABLE student_academic_enrollments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_year_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    classroom_id INT UNSIGNED NOT NULL,

    enrollment_status ENUM(
        'active',
        'completed',
        'transferred',
        'withdrawn'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id),

    FOREIGN KEY (student_id)
        REFERENCES students(id),

    FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id),

    UNIQUE KEY uq_student_academic_year
        (academic_year_id, student_id),

    KEY idx_year_classroom
        (academic_year_id, classroom_id),

    KEY idx_year_student
        (academic_year_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

