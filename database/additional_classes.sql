CREATE TABLE IF NOT EXISTS additional_classes (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_term_id    INT UNSIGNED NOT NULL,
    classroom_id        INT UNSIGNED NOT NULL,

    subject_id          INT UNSIGNED NOT NULL,
    staff_id            INT UNSIGNED NOT NULL,

    class_date          DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,

    class_type          ENUM('makeup', 'extra') NOT NULL,

    -- Original class details, entered manually for now.
    -- Normally used when class_type = 'makeup'.
    original_class_date DATE NULL,
    original_period_no  TINYINT UNSIGNED NULL,

    reason              VARCHAR(255) NULL,

    status              ENUM('scheduled', 'completed', 'cancelled')
                        NOT NULL DEFAULT 'scheduled',

    created_by          INT UNSIGNED NULL,
    updated_by          INT UNSIGNED NULL,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ac_academic_term
        FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id),

    CONSTRAINT fk_ac_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_ac_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id),

    CONSTRAINT fk_ac_staff
        FOREIGN KEY (staff_id) REFERENCES staff(id),

    CONSTRAINT fk_ac_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ac_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL,
    
    CONSTRAINT chk_ac_time
        CHECK (end_time > start_time),

    KEY idx_ac_term (academic_term_id),
    KEY idx_ac_classroom_date (classroom_id, class_date),
    KEY idx_ac_date (class_date),
    KEY idx_ac_subject (subject_id),
    KEY idx_ac_staff (staff_id),
    KEY idx_ac_original_class (original_class_date, original_period_no),
    KEY idx_ac_class_type (class_type),
    KEY idx_ac_status (status),
    KEY idx_ac_term_classroom_date
    (academic_term_id, classroom_id, class_date)    

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;