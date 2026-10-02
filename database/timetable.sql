CREATE TABLE IF NOT EXISTS timetables (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timetable_name  VARCHAR(150) NOT NULL,
  classroom_id    INT UNSIGNED NOT NULL,
  academic_term_id INT UNSIGNED NOT NULL,
  format_id       INT UNSIGNED NOT NULL,
  effective_from  DATE NOT NULL,
  effective_to    DATE NULL,
  notes           TEXT NULL,
  version         INT UNSIGNED NOT NULL DEFAULT 1,
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