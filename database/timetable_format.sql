-- =============================================================================
-- timetable_format.sql
--
-- Tables: timetable_formats, timetable_format_days, timetable_format_periods
--
-- A "format" is a reusable weekly template (e.g. "Regular 8-Period Format",
-- "Exam Week Format") made up of:
--   - days    -> which weekdays it runs on, and their display order
--   - periods -> the period grid (order, key, label, timing, break/lunch flags)
--
-- timetables.format_id (see your ERD) points at timetable_formats.id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS timetable_formats (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  format_name  VARCHAR(100)  NOT NULL,
  description  VARCHAR(255)  NULL,
  course       INT UNSIGNED NOT NULL,
  is_active    BOOLEAN       NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_timetable_formats_name (format_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





CREATE TABLE IF NOT EXISTS timetable_format_days (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  format_id  INT UNSIGNED NOT NULL,
  day_order  TINYINT UNSIGNED NOT NULL,
  day_name   ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') NOT NULL,

  CONSTRAINT fk_ttfd_format
    FOREIGN KEY (format_id) REFERENCES timetable_formats(id)
    ON DELETE CASCADE,

  UNIQUE KEY uq_ttfd_format_order (format_id, day_order),
  UNIQUE KEY uq_ttfd_format_day   (format_id, day_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




CREATE TABLE IF NOT EXISTS timetable_format_periods (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  format_id     INT UNSIGNED NOT NULL,
  period_order  TINYINT UNSIGNED NOT NULL,
  period_key    VARCHAR(20)  NOT NULL,
  period_label  VARCHAR(50)  NOT NULL,
  start_time    TIME NULL,
  end_time      TIME NULL,
  is_break      BOOLEAN NULL DEFAULT 0,
  is_lunch      BOOLEAN NULL DEFAULT 0,

  CONSTRAINT fk_ttfp_format
    FOREIGN KEY (format_id) REFERENCES timetable_formats(id)
    ON DELETE CASCADE,

  UNIQUE KEY uq_ttfp_format_order (format_id, period_order),
  UNIQUE KEY uq_ttfp_format_key   (format_id, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;