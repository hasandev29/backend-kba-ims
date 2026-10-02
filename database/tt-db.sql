-- ============================================================
-- COLLEGE ERP - TIMETABLE & ATTENDANCE SCHEMA
-- ============================================================
-- Table creation order:
--
-- 1. academic_terms
-- 2. timetables
-- 3. timetable_slots
-- 4. academic_calendar
-- 5. additional_classes
-- 6. attendance_sessions
-- 7. attendance_records
--
-- Depends on tables from the core schema (must already exist):
--   courses, classrooms, subjects, staff, students, users
--
-- Also references the following tables which are NOT created in
-- this file and must exist beforehand:
--   timetable_formats, timetable_format_days, timetable_format_periods
--
-- ============================================================


-- ============================================================
-- 1. ACADEMIC_TERMS
-- Depends on: courses
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_terms (
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


-- ============================================================
-- 2. TIMETABLES
-- Depends on: classrooms, academic_terms, timetable_formats, users
-- ============================================================

CREATE TABLE IF NOT EXISTS timetables (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timetable_name  VARCHAR(150) NOT NULL,
  classroom_id    INT UNSIGNED NOT NULL,
  academic_term_id INT UNSIGNED NOT NULL,
  format_id       INT UNSIGNED NOT NULL,
  effective_from  DATE NOT NULL,
  effective_to    DATE NULL,
  notes           TEXT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_by      INT UNSIGNED NULL,
  updated_by      INT UNSIGNED NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_timetables_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
  CONSTRAINT fk_timetables_format
    FOREIGN KEY (format_id) REFERENCES timetable_formats(id),
  CONSTRAINT fk_timetables_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_timetables_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_timetables_academic_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id),

  KEY idx_timetables_classroom (classroom_id),
  KEY idx_timetables_format    (format_id),
  KEY idx_timetables_is_active (is_active),
  KEY idx_timetables_academic_term (academic_term_id),
  KEY idx_timetables_term_classroom_active (academic_term_id, classroom_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. TIMETABLE_SLOTS
-- Depends on: timetables, timetable_format_days,
--             timetable_format_periods, subjects, staff
-- ============================================================

CREATE TABLE IF NOT EXISTS timetable_slots (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timetable_id  INT UNSIGNED NOT NULL,
  day_id        INT UNSIGNED NOT NULL,
  period_id     INT UNSIGNED NOT NULL,
  subject_id    INT UNSIGNED NULL,
  staff_id      INT UNSIGNED NOT NULL,
  remarks       VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ts_timetable
    FOREIGN KEY (timetable_id) REFERENCES timetables(id) ON DELETE CASCADE,
  CONSTRAINT fk_ts_day
    FOREIGN KEY (day_id) REFERENCES timetable_format_days(id),
  CONSTRAINT fk_ts_period
    FOREIGN KEY (period_id) REFERENCES timetable_format_periods(id),
  CONSTRAINT fk_ts_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_ts_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id),
  -- one slot per (timetable, day, period) cell — this is what makes the
  -- upsert-by-cell semantics in the model safe (INSERT ... ON DUPLICATE KEY UPDATE)
  UNIQUE KEY uq_ts_timetable_day_period (timetable_id, day_id, period_id),

  KEY idx_ts_subject (subject_id),
  KEY idx_ts_staff (staff_id),
  KEY idx_ts_timetable_subject (timetable_id, subject_id),
  KEY idx_ts_timetable_staff   (timetable_id, staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. ACADEMIC_CALENDAR
-- Depends on: academic_terms, classrooms, users
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_calendar (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  academic_term_id   INT UNSIGNED NOT NULL,
  classroom_id       INT UNSIGNED NULL,

  calendar_date      DATE NOT NULL,

  event_type         ENUM( 'HOLIDAY',
    'EVENT', 'EXAM' ) NOT NULL,
  affects_attendance BOOLEAN NOT NULL DEFAULT FALSE,

  title              VARCHAR(150) NOT NULL,
  description        TEXT NULL,

  is_active          BOOLEAN NOT NULL DEFAULT TRUE,

  created_by         INT UNSIGNED NULL,
  updated_by         INT UNSIGNED NULL,

  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_academic_calendar_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id),
  CONSTRAINT fk_academic_calendar_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_academic_calendar_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_academic_calendar_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  KEY idx_academic_calendar_term_date
    (academic_term_id, calendar_date),

  KEY idx_academic_calendar_term_classroom_date
    (academic_term_id, classroom_id, calendar_date),

  KEY idx_academic_calendar_classroom_date
    (classroom_id, calendar_date),

  KEY idx_academic_calendar_type
    (event_type),

  KEY idx_academic_calendar_active
    (is_active),

  KEY idx_academic_calendar_attendance
    (affects_attendance)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. ADDITIONAL_CLASSES
-- Depends on: academic_terms, classrooms, subjects, staff, users
-- ============================================================

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


-- ============================================================
-- 6. ATTENDANCE_SESSIONS
-- Depends on: academic_terms, timetable_slots, classrooms,
--             subjects, staff, timetable_format_periods,
--             users, additional_classes
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_term_id     INT UNSIGNED NOT NULL,
  timetable_slot_id  INT UNSIGNED NULL,
  additional_class_id INT UNSIGNED NULL,
  attendance_date    DATE NOT NULL,
  classroom_id       INT UNSIGNED NOT NULL,
  subject_id         INT UNSIGNED NOT NULL,
  staff_id           INT UNSIGNED NOT NULL,
  period_id          INT UNSIGNED NULL,
  session_type       ENUM('regular', 'makeup', 'extra') NOT NULL,
  session_status     ENUM('draft', 'completed', 'cancelled') NOT NULL,
  submitted_at       DATETIME NULL,
  remarks            TEXT NULL,
  created_by         INT UNSIGNED NULL,
  updated_by         INT UNSIGNED NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_as_academic_term
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id),

  CONSTRAINT fk_as_timetable_slot
    FOREIGN KEY (timetable_slot_id) REFERENCES timetable_slots(id),
  CONSTRAINT fk_as_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
  CONSTRAINT fk_as_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_as_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id),
  CONSTRAINT fk_as_period
    FOREIGN KEY (period_id) REFERENCES timetable_format_periods(id),
  CONSTRAINT fk_as_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_as_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT fk_as_additional_class
    FOREIGN KEY (additional_class_id)
    REFERENCES additional_classes(id),
  CONSTRAINT chk_as_source
      CHECK ((timetable_slot_id IS NOT NULL AND additional_class_id IS NULL) OR
          (timetable_slot_id IS NULL AND additional_class_id IS NOT NULL)),

  CONSTRAINT chk_as_session_type
    CHECK (
      (session_type = 'regular'
       AND timetable_slot_id IS NOT NULL
       AND additional_class_id IS NULL)
      OR
      (session_type IN ('makeup', 'extra')
       AND timetable_slot_id IS NULL
       AND additional_class_id IS NOT NULL)
    ),

  UNIQUE KEY uq_as_additional_class (additional_class_id),

  UNIQUE KEY uq_as_date_slot (attendance_date, timetable_slot_id),
  KEY idx_as_classroom (classroom_id),
  KEY idx_as_staff     (staff_id),
  KEY idx_as_subject   (subject_id),
  KEY idx_as_term_date_classroom
  (academic_term_id, attendance_date, classroom_id),

  KEY idx_as_term_date_subject
  (academic_term_id, attendance_date, subject_id),

  KEY idx_as_term_subject
  (academic_term_id, subject_id),
  KEY idx_as_term_classroom_subject_date
  (academic_term_id, classroom_id, subject_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. ATTENDANCE_RECORDS
-- Depends on: attendance_sessions, students
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id         INT UNSIGNED NOT NULL,
  student_id         INT UNSIGNED NOT NULL,
  attendance_status ENUM('present', 'absent', 'od') NOT NULL,
  check_in_time      TIME NULL,
  remarks            VARCHAR(255) NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ar_session
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ar_student
    FOREIGN KEY (student_id) REFERENCES students(id),

  UNIQUE KEY uq_ar_session_student (session_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================