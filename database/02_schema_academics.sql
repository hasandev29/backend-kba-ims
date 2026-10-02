-- database/schema_academics.sql

-- ============================================================
-- COLLEGE ERP - ACADEMICS SCHEMA (TIMETABLE & ATTENDANCE)
-- ============================================================
-- Assumes schema_core.sql has already been executed
-- (courses, classrooms, subjects, staff, students, users,
-- academic_terms).
--
-- Table creation order:
--
-- 1.  academic_calendar
-- 2.  academic_calendar_classrooms
-- 3.  timetable_formats
-- 4.  timetable_format_days
-- 5.  timetable_format_periods
-- 6.  timetables
-- 7.  timetable_slots
-- 8.  additional_classes
-- 9.  attendance_sessions
-- 10. attendance_records
--
-- ============================================================


-- ============================================================
-- 1. ACADEMIC CALENDAR
-- Depends on: users
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_calendar (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    calendar_date DATE NOT NULL,
    event_type ENUM('HOLIDAY','EVENT','EXAM') COLLATE utf8mb4_unicode_ci NOT NULL,
    affects_attendance TINYINT(1) NOT NULL DEFAULT 0,
    applies_to_all_classrooms TINYINT(1) NOT NULL DEFAULT 1,
    color_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(150) COLLATE utf8mb4_unicode_ci NOT NULL,
    description TEXT COLLATE utf8mb4_unicode_ci,
    created_by INT UNSIGNED DEFAULT NULL,
    updated_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY fk_academic_calendar_created_by (created_by),
    KEY fk_academic_calendar_updated_by (updated_by),
    KEY idx_academic_calendar_date (calendar_date),
    KEY idx_academic_calendar_type (event_type),
    KEY idx_academic_calendar_attendance (affects_attendance),
    KEY idx_academic_calendar_color (color_id),
    KEY idx_academic_calendar_applies_all (applies_to_all_classrooms),

    CONSTRAINT fk_academic_calendar_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_academic_calendar_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. ACADEMIC CALENDAR CLASSROOMS
-- Depends on: academic_calendar, classrooms
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_calendar_classrooms (
    academic_calendar_id INT UNSIGNED NOT NULL,
    classroom_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (academic_calendar_id, classroom_id),

    KEY idx_acc_classroom (classroom_id),

    CONSTRAINT fk_acc_calendar
        FOREIGN KEY (academic_calendar_id)
        REFERENCES academic_calendar(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_acc_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. TIMETABLE FORMATS
-- Depends on: courses (course column, no FK enforced)
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_formats (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    format_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    course INT UNSIGNED NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_timetable_formats_name (format_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. TIMETABLE FORMAT DAYS
-- Depends on: timetable_formats
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_format_days (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    format_id INT UNSIGNED NOT NULL,
    day_order TINYINT UNSIGNED NOT NULL,
    day_name ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') NOT NULL,

    CONSTRAINT fk_ttfd_format
        FOREIGN KEY (format_id)
        REFERENCES timetable_formats(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_ttfd_format_order (format_id, day_order),
    UNIQUE KEY uq_ttfd_format_day (format_id, day_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. TIMETABLE FORMAT PERIODS
-- Depends on: timetable_formats
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_format_periods (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    format_id INT UNSIGNED NOT NULL,
    period_order TINYINT UNSIGNED NOT NULL,
    period_key VARCHAR(20) NOT NULL,
    period_label VARCHAR(50) NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    is_break BOOLEAN NULL DEFAULT 0,
    is_lunch BOOLEAN NULL DEFAULT 0,

    CONSTRAINT fk_ttfp_format
        FOREIGN KEY (format_id)
        REFERENCES timetable_formats(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_ttfp_format_order (format_id, period_order),
    UNIQUE KEY uq_ttfp_format_key (format_id, period_key)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. TIMETABLES
-- Depends on: classrooms, academic_terms, timetable_formats, users
-- ============================================================

CREATE TABLE IF NOT EXISTS timetables (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    timetable_name VARCHAR(150) NOT NULL,
    classroom_id INT UNSIGNED NOT NULL,
    academic_term_id INT UNSIGNED NOT NULL,
    format_id INT UNSIGNED NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    notes TEXT NULL,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by INT UNSIGNED NULL,
    updated_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_timetables_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id),

    CONSTRAINT fk_timetables_format
        FOREIGN KEY (format_id)
        REFERENCES timetable_formats(id),

    CONSTRAINT fk_timetables_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_timetables_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_timetables_academic_term
        FOREIGN KEY (academic_term_id)
        REFERENCES academic_terms(id),

    KEY idx_timetables_classroom (classroom_id),
    KEY idx_timetables_format (format_id),
    KEY idx_timetables_is_active (is_active),
    KEY idx_timetables_academic_term (academic_term_id),
    KEY idx_timetables_term_classroom_active (academic_term_id, classroom_id, is_active)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. TIMETABLE SLOTS
-- Depends on: timetables, timetable_format_days,
--             timetable_format_periods, subjects, staff
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_slots (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT UNSIGNED NOT NULL,
    day_id INT UNSIGNED NOT NULL,
    period_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NULL,
    staff_id INT UNSIGNED NOT NULL,
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ts_timetable
        FOREIGN KEY (timetable_id)
        REFERENCES timetables(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ts_day
        FOREIGN KEY (day_id)
        REFERENCES timetable_format_days(id),

    CONSTRAINT fk_ts_period
        FOREIGN KEY (period_id)
        REFERENCES timetable_format_periods(id),

    CONSTRAINT fk_ts_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_ts_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id),

    -- one slot per (timetable, day, period) cell -- this is what makes the
    -- upsert-by-cell semantics in the model safe (INSERT ... ON DUPLICATE KEY UPDATE)
    UNIQUE KEY uq_ts_timetable_day_period (timetable_id, day_id, period_id),

    KEY idx_ts_subject (subject_id),
    KEY idx_ts_staff (staff_id),
    KEY idx_ts_timetable_subject (timetable_id, subject_id),
    KEY idx_ts_timetable_staff (timetable_id, staff_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. ADDITIONAL CLASSES
-- Depends on: academic_terms, classrooms, subjects, staff, users
-- ============================================================

CREATE TABLE IF NOT EXISTS additional_classes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_term_id INT UNSIGNED NOT NULL,
    classroom_id INT UNSIGNED NOT NULL,

    subject_id INT UNSIGNED NOT NULL,
    staff_id INT UNSIGNED NOT NULL,

    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    class_type ENUM('makeup', 'extra') NOT NULL,

    -- Original class details, entered manually for now.
    -- Normally used when class_type = 'makeup'.
    original_class_date DATE NULL,
    original_period_no TINYINT UNSIGNED NULL,

    reason VARCHAR(255) NULL,

    status ENUM('scheduled', 'completed', 'cancelled')
        NOT NULL DEFAULT 'scheduled',

    created_by INT UNSIGNED NULL,
    updated_by INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ac_academic_term
        FOREIGN KEY (academic_term_id)
        REFERENCES academic_terms(id),

    CONSTRAINT fk_ac_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id),

    CONSTRAINT fk_ac_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_ac_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id),

    CONSTRAINT fk_ac_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ac_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
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
    KEY idx_ac_term_classroom_date (academic_term_id, classroom_id, class_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. ATTENDANCE SESSIONS
-- Depends on: academic_terms, timetable_slots, classrooms,
--             subjects, staff, users, additional_classes
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    academic_term_id INT UNSIGNED NOT NULL,
    timetable_slot_id INT UNSIGNED NULL,
    additional_class_id INT UNSIGNED NULL,
    attendance_date DATE NOT NULL,
    classroom_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    staff_id INT UNSIGNED NOT NULL,
    session_type ENUM('regular', 'makeup', 'extra') NOT NULL,
    session_status ENUM('draft', 'completed', 'cancelled') NOT NULL,
    submitted_at DATETIME NULL,
    remarks TEXT NULL,
    created_by INT UNSIGNED NULL,
    updated_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_as_academic_term
        FOREIGN KEY (academic_term_id)
        REFERENCES academic_terms(id),

    CONSTRAINT fk_as_timetable_slot
        FOREIGN KEY (timetable_slot_id)
        REFERENCES timetable_slots(id),

    CONSTRAINT fk_as_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id),

    CONSTRAINT fk_as_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_as_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff(id),

    CONSTRAINT fk_as_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_as_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_as_additional_class
        FOREIGN KEY (additional_class_id)
        REFERENCES additional_classes(id),

    CONSTRAINT chk_as_source
        CHECK (
            (timetable_slot_id IS NOT NULL AND additional_class_id IS NULL)
            OR
            (timetable_slot_id IS NULL AND additional_class_id IS NOT NULL)
        ),

    CONSTRAINT chk_as_session_type
        CHECK (
            (
                session_type = 'regular'
                AND timetable_slot_id IS NOT NULL
                AND additional_class_id IS NULL
            )
            OR
            (
                session_type IN ('makeup', 'extra')
                AND timetable_slot_id IS NULL
                AND additional_class_id IS NOT NULL
            )
        ),

    UNIQUE KEY uq_as_additional_class (additional_class_id),

    UNIQUE KEY uq_as_date_slot (attendance_date, timetable_slot_id),

    KEY idx_as_classroom (classroom_id),
    KEY idx_as_staff (staff_id),
    KEY idx_as_subject (subject_id),

    KEY idx_as_term_date_classroom (academic_term_id, attendance_date, classroom_id),

    KEY idx_as_term_date_subject (academic_term_id, attendance_date, subject_id),

    KEY idx_as_term_subject (academic_term_id, subject_id),

    KEY idx_as_term_classroom_subject_date
        (academic_term_id, classroom_id, subject_id, attendance_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. ATTENDANCE RECORDS
-- Depends on: attendance_sessions, students
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    attendance_status ENUM('present', 'absent', 'od') NOT NULL,
    check_in_time TIME NULL,
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ar_session
        FOREIGN KEY (session_id)
        REFERENCES attendance_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ar_student
        FOREIGN KEY (student_id)
        REFERENCES students(id),

    UNIQUE KEY uq_ar_session_student (session_id, student_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================
