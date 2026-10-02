CREATE TABLE IF NOT EXISTS attendance_sessions (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_term_id    INT UNSIGNED NOT NULL,
  timetable_slot_id   INT UNSIGNED NULL,
  additional_class_id INT UNSIGNED NULL,
  attendance_date     DATE NOT NULL,
  classroom_id        INT UNSIGNED NOT NULL,
  subject_id          INT UNSIGNED NOT NULL,
  staff_id            INT UNSIGNED NOT NULL,
  session_type        ENUM('regular', 'makeup', 'extra') NOT NULL,
  session_status      ENUM('draft', 'completed', 'cancelled') NOT NULL,
  submitted_at        DATETIME NULL,
  remarks             TEXT NULL,
  created_by          INT UNSIGNED NULL,
  updated_by          INT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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

  CONSTRAINT fk_as_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_as_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
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

  KEY idx_as_term_date_classroom
    (academic_term_id, attendance_date, classroom_id),

  KEY idx_as_term_date_subject
    (academic_term_id, attendance_date, subject_id),

  KEY idx_as_term_subject
    (academic_term_id, subject_id),

  KEY idx_as_term_classroom_subject_date
    (academic_term_id, classroom_id, subject_id, attendance_date)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



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