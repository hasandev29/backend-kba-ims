CREATE TABLE academic_calendar (
    id                        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    calendar_date             DATE NOT NULL,
    event_type                ENUM('HOLIDAY','EVENT','EXAM') COLLATE utf8mb4_unicode_ci NOT NULL,
    affects_attendance        TINYINT(1) NOT NULL DEFAULT 0,
    applies_to_all_classrooms TINYINT(1) NOT NULL DEFAULT 1,
    color_id                  INT UNSIGNED DEFAULT NULL,
    title                     VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    description               TEXT COLLATE utf8mb4_unicode_ci,
    created_by                INT UNSIGNED DEFAULT NULL,
    updated_by                INT UNSIGNED DEFAULT NULL,
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY fk_academic_calendar_created_by (created_by),
    KEY fk_academic_calendar_updated_by (updated_by),
    KEY idx_academic_calendar_date (calendar_date),
    KEY idx_academic_calendar_type (event_type),
    KEY idx_academic_calendar_attendance (affects_attendance),
    KEY idx_academic_calendar_color (color_id),
    KEY idx_academic_calendar_applies_all (applies_to_all_classrooms),

    CONSTRAINT fk_academic_calendar_created_by
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,

    CONSTRAINT fk_academic_calendar_updated_by
        FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE academic_calendar_classrooms (
    academic_calendar_id INT UNSIGNED NOT NULL,
    classroom_id         INT UNSIGNED NOT NULL,

    PRIMARY KEY (academic_calendar_id, classroom_id),

    KEY idx_acc_classroom (classroom_id),

    CONSTRAINT fk_acc_calendar
        FOREIGN KEY (academic_calendar_id) REFERENCES academic_calendar (id) ON DELETE CASCADE,

    CONSTRAINT fk_acc_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;