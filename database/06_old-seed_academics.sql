-- database/seed_academics.sql

-- ============================================================
-- COLLEGE ERP - ACADEMICS SEED DATA (TIMETABLE & ATTENDANCE)
-- ============================================================
-- Assumes schema_core.sql, seed_core.sql and schema_academics.sql
-- have already been executed.
--
-- Seed order:
-- 1.  academic_calendar (holidays)
-- 2.  academic_calendar (exams)
-- 3.  academic_calendar_classrooms
-- 4.  timetable_formats
-- 5.  timetable_format_days
-- 6.  timetable_format_periods
-- 7.  timetables
-- 8.  timetable_slots
-- 9.  additional_classes
-- 10. attendance_sessions
-- 11. attendance_records
--
-- Conventions used in this file:
-- - All dates fall inside the KBA "2024-2025 Odd Term"
--   (2024-06-01 to 2024-11-30), the current academic term.
-- - attendance_records uses only 'present', 'absent' and 'od',
--   since 'late', 'leave' and 'excused' have been removed from
--   that table's ENUM.
-- ============================================================

-- ============================================================
-- 1. ACADEMIC CALENDAR - INDIAN GOVERNMENT HOLIDAYS
-- ============================================================
-- 10 Indian government holidays. Every holiday affects
-- attendance and applies to all classrooms, so no rows are
-- needed in academic_calendar_classrooms for these.
-- ============================================================

INSERT INTO academic_calendar
(calendar_date, event_type, affects_attendance, applies_to_all_classrooms,
 color_id, title, description, created_by, updated_by)
VALUES
('2024-08-15', 'HOLIDAY', 1, 1, NULL, 'Independence Day', 'National holiday - Independence Day', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-09-07', 'HOLIDAY', 1, 1, NULL, 'Ganesh Chaturthi', 'National holiday - Ganesh Chaturthi', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-10-02', 'HOLIDAY', 1, 1, NULL, 'Gandhi Jayanti', 'National holiday - Gandhi Jayanti', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-10-12', 'HOLIDAY', 1, 1, NULL, 'Vijayadashami (Dussehra)', 'National holiday - Vijayadashami (Dussehra)', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-10-31', 'HOLIDAY', 1, 1, NULL, 'Diwali (Deepavali)', 'National holiday - Diwali (Deepavali)', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-11-15', 'HOLIDAY', 1, 1, NULL, 'Guru Nanak Jayanti', 'National holiday - Guru Nanak Jayanti', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-12-25', 'HOLIDAY', 1, 1, NULL, 'Christmas', 'National holiday - Christmas', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2025-01-14', 'HOLIDAY', 1, 1, NULL, 'Makar Sankranti / Pongal', 'National holiday - Makar Sankranti / Pongal', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2025-01-26', 'HOLIDAY', 1, 1, NULL, 'Republic Day', 'National holiday - Republic Day', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2025-03-14', 'HOLIDAY', 1, 1, NULL, 'Holi', 'National holiday - Holi', (SELECT id FROM users WHERE user_id = 'ad'), NULL);

-- ============================================================
-- 2. ACADEMIC CALENDAR - EXAMS
-- ============================================================
-- 1st & 2nd Year exams and 3rd/4th/5th Year exams are held on
-- different dates and do NOT apply to all classrooms
-- (applies_to_all_classrooms = 0). The exact classrooms each
-- exam affects are recorded separately in
-- academic_calendar_classrooms below.
--
-- On '1st & 2nd Year Odd Semester Exam' (2024-09-16):
--   - 1st/2nd Year classrooms have no regular attendance
--     (they are writing the exam).
--   - 3rd, 4th and 5th Year classrooms continue attendance
--     as usual, since they are not linked to this event.
--
-- On '3rd, 4th & 5th Year Odd Semester Exam' (2024-09-18) it
-- is the reverse: those three classrooms are exempt and
-- 1st/2nd Year classrooms attend normally.
-- ============================================================

INSERT INTO academic_calendar
(calendar_date, event_type, affects_attendance, applies_to_all_classrooms,
 color_id, title, description, created_by, updated_by)
VALUES
('2024-09-16', 'EXAM', 1, 0, NULL,
 '1st & 2nd Year Odd Semester Exam',
 'Odd semester examinations for 1st Year and 2nd Year classrooms',
 (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2024-09-18', 'EXAM', 1, 0, NULL,
 '3rd, 4th & 5th Year Odd Semester Exam',
 'Odd semester examinations for 3rd Year, 4th Year and 5th Year classrooms',
 (SELECT id FROM users WHERE user_id = 'ad'), NULL);

-- ============================================================
-- 3. ACADEMIC CALENDAR CLASSROOMS
-- ============================================================

INSERT INTO academic_calendar_classrooms
(academic_calendar_id, classroom_id)
VALUES
((SELECT id FROM academic_calendar WHERE title = '1st & 2nd Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '1st Year A Sec')),
((SELECT id FROM academic_calendar WHERE title = '1st & 2nd Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '1st Year B Sec')),
((SELECT id FROM academic_calendar WHERE title = '1st & 2nd Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '2nd Year A Sec')),
((SELECT id FROM academic_calendar WHERE title = '1st & 2nd Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '2nd Year B Sec')),
((SELECT id FROM academic_calendar WHERE title = '3rd, 4th & 5th Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '3rd Year')),
((SELECT id FROM academic_calendar WHERE title = '3rd, 4th & 5th Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '4th Year')),
((SELECT id FROM academic_calendar WHERE title = '3rd, 4th & 5th Year Odd Semester Exam'), (SELECT id FROM classrooms WHERE name = '5th Year'));

-- ============================================================
-- 4. TIMETABLE FORMATS
-- ============================================================
-- One format for course KBA: Monday - Saturday, 8 class
-- periods with one break and one lunch (10 rows total in
-- timetable_format_periods).
-- ============================================================

INSERT INTO timetable_formats
(format_name, description, course, is_active)
VALUES
('KBA Standard Timetable', 'Monday to Saturday, 8 class periods with one break and one lunch', (SELECT id FROM courses WHERE name = 'KBA'), 1);

-- ============================================================
-- 5. TIMETABLE FORMAT DAYS
-- ============================================================

INSERT INTO timetable_format_days
(format_id, day_order, day_name)
VALUES
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 1, 'MONDAY'),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 2, 'TUESDAY'),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 3, 'WEDNESDAY'),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 4, 'THURSDAY'),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 5, 'FRIDAY'),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 6, 'SATURDAY');

-- ============================================================
-- 6. TIMETABLE FORMAT PERIODS
-- ============================================================
-- 3 periods, a break, 2 periods, lunch, then 3 more periods --
-- 8 class periods and 10 rows in total, starting at 9:00 AM.
-- ============================================================

INSERT INTO timetable_format_periods
(format_id, period_order, period_key, period_label, start_time, end_time, is_break, is_lunch)
VALUES
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 1, 'P1', 'Period 1', '09:00:00', '09:45:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 2, 'P2', 'Period 2', '09:45:00', '10:30:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 3, 'P3', 'Period 3', '10:30:00', '11:15:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 4, 'BREAK', 'Break', '11:15:00', '11:30:00', 1, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 5, 'P4', 'Period 4', '11:30:00', '12:15:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 6, 'P5', 'Period 5', '12:15:00', '13:00:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 7, 'LUNCH', 'Lunch', '13:00:00', '13:45:00', 0, 1),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 8, 'P6', 'Period 6', '13:45:00', '14:30:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 9, 'P7', 'Period 7', '14:30:00', '15:15:00', 0, 0),
((SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), 10, 'P8', 'Period 8', '15:15:00', '16:00:00', 0, 0);

-- ============================================================
-- 7. TIMETABLES
-- ============================================================
-- One timetable per classroom for September (version 1,
-- superseded, is_active = 0) and one for October (version 2,
-- current, is_active = 1), for the 5 classrooms that have
-- students and subjects seeded in seed_core.sql.
-- 4th Year and 5th Year have no batch/students yet, so no
-- timetable is created for them here.
-- ============================================================

INSERT INTO timetables
(timetable_name, classroom_id, academic_term_id, format_id,
 effective_from, effective_to, notes, version, is_active,
 created_by, updated_by)
VALUES
('1st Year A Sec - September 2024', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-09-01', '2024-09-30', 'September 2024 timetable', 1, 0, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('1st Year A Sec - October 2024', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-10-01', '2024-10-31', 'October 2024 timetable - subjects rotated for the new month', 2, 1, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('1st Year B Sec - September 2024', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-09-01', '2024-09-30', 'September 2024 timetable', 1, 0, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('1st Year B Sec - October 2024', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-10-01', '2024-10-31', 'October 2024 timetable - subjects rotated for the new month', 2, 1, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('2nd Year A Sec - September 2024', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-09-01', '2024-09-30', 'September 2024 timetable', 1, 0, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('2nd Year A Sec - October 2024', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-10-01', '2024-10-31', 'October 2024 timetable - subjects rotated for the new month', 2, 1, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('2nd Year B Sec - September 2024', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-09-01', '2024-09-30', 'September 2024 timetable', 1, 0, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('2nd Year B Sec - October 2024', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-10-01', '2024-10-31', 'October 2024 timetable - subjects rotated for the new month', 2, 1, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('3rd Year - September 2024', (SELECT id FROM classrooms WHERE name = '3rd Year'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-09-01', '2024-09-30', 'September 2024 timetable', 1, 0, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')),
('3rd Year - October 2024', (SELECT id FROM classrooms WHERE name = '3rd Year'), (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'), (SELECT id FROM timetable_formats WHERE format_name = 'KBA Standard Timetable'), '2024-10-01', '2024-10-31', 'October 2024 timetable - subjects rotated for the new month', 2, 1, (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad'));

-- ============================================================
-- 8. TIMETABLE SLOTS
-- ============================================================
-- 8 class periods x 6 days = 48 slots per classroom per month.
-- Each classroom only has 5 Islamic-studies subjects (from
-- seed_core.sql), so subjects repeat across the week; the
-- rotation start point is shifted for October so the weekly
-- pattern is genuinely different from September while still
-- using the same 5 subjects and their handling staff.
-- Break and lunch periods are intentionally left without slots.
-- ============================================================

-- 1st Year A Sec -- September 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'AQD-1A' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '1st Year A Sec')
   AND tt.timetable_name = '1st Year A Sec - September 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 1st Year A Sec -- October 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'SRH-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'QRT-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'NHW-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'AQD-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'FQB-1A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'SRH-1A' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '1st Year A Sec')
   AND tt.timetable_name = '1st Year A Sec - October 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 1st Year B Sec -- September 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'AQD-1B' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '1st Year B Sec')
   AND tt.timetable_name = '1st Year B Sec - September 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 1st Year B Sec -- October 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'SRH-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'QRT-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'NHW-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'AQD-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'FQB-1B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'SRH-1B' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '1st Year B Sec')
   AND tt.timetable_name = '1st Year B Sec - October 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 2nd Year A Sec -- September 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'TFS-2A' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '2nd Year A Sec')
   AND tt.timetable_name = '2nd Year A Sec - September 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 2nd Year A Sec -- October 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'IHS-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'HD1-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'SRF-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'TFS-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'FQM-2A' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'IHS-2A' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '2nd Year A Sec')
   AND tt.timetable_name = '2nd Year A Sec - October 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 2nd Year B Sec -- September 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'TFS-2B' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '2nd Year B Sec')
   AND tt.timetable_name = '2nd Year B Sec - September 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 2nd Year B Sec -- October 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'IHS-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'HD1-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'SRF-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'TFS-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'FQM-2B' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'IHS-2B' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '2nd Year B Sec')
   AND tt.timetable_name = '2nd Year B Sec - October 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 3rd Year -- September 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'TF2-3' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '3rd Year')
   AND tt.timetable_name = '3rd Year - September 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- 3rd Year -- October 2024
INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id, tfd.id, tfp.id, subj.id, subj.handling_staff_id, NULL
FROM (
    SELECT 1 AS day_order, 'P1' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P2' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P3' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P4' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P5' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P6' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P7' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 1 AS day_order, 'P8' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P1' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P2' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P3' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P4' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P5' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P6' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P7' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 2 AS day_order, 'P8' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P1' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P2' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P3' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P4' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P5' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P6' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P7' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 3 AS day_order, 'P8' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P1' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P2' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P3' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P4' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P5' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P6' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P7' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 4 AS day_order, 'P8' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P1' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P2' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P3' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P4' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P5' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P6' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P7' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 5 AS day_order, 'P8' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P1' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P2' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P3' AS period_key, 'AKH-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P4' AS period_key, 'UFQ-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P5' AS period_key, 'UHD-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P6' AS period_key, 'TF2-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P7' AS period_key, 'ADB-3' AS subject_code
    UNION ALL SELECT 6 AS day_order, 'P8' AS period_key, 'AKH-3' AS subject_code
) AS map
JOIN timetables tt
    ON tt.classroom_id = (SELECT id FROM classrooms WHERE name = '3rd Year')
   AND tt.timetable_name = '3rd Year - October 2024'
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id AND tfd.day_order = map.day_order
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id AND tfp.period_key = map.period_key
JOIN subjects subj
    ON subj.code = map.subject_code;

-- ============================================================
-- 9. ADDITIONAL CLASSES
-- ============================================================
-- One extra class and one makeup class in the week of
-- 2024-09-23 to 2024-09-28, both for '1st Year A Sec' /
-- subject QRT-1A, taught by that subject's handling staff.
-- ============================================================

INSERT INTO additional_classes
(academic_term_id, classroom_id, subject_id, staff_id, class_date,
 start_time, end_time, class_type, original_class_date,
 original_period_no, reason, status, created_by, updated_by)
VALUES
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '1st Year A Sec'),
    (SELECT id FROM subjects WHERE code = 'QRT-1A'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'QRT-1A'),
    '2024-09-25', '16:15:00', '17:00:00', 'extra',
    NULL, NULL,
    'Extra class for exam preparation',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2024-2025 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '1st Year A Sec'),
    (SELECT id FROM subjects WHERE code = 'QRT-1A'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'QRT-1A'),
    '2024-09-27', '16:15:00', '17:00:00', 'makeup',
    '2024-09-07', 3,
    'Makeup class for the period missed on 2024-09-07 (Ganesh Chaturthi holiday)',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
);

-- ============================================================
-- 10. ATTENDANCE SESSIONS
-- ============================================================
-- One regular attendance session per timetable slot, per
-- classroom, for 10 school days in September
-- (2024-09-02 to 2024-09-14, Monday-Saturday, skipping
-- Sunday 2024-09-08 and the Ganesh Chaturthi holiday on
-- 2024-09-07). All 10 dates fall before the exam dates
-- (2024-09-16 / 2024-09-18), so no clash with the exam
-- calendar entries above.
-- ============================================================

INSERT INTO attendance_sessions
(academic_term_id, timetable_slot_id, additional_class_id, attendance_date,
 classroom_id, subject_id, staff_id, session_type, session_status,
 submitted_at, remarks, created_by, updated_by)
SELECT
    t.academic_term_id,
    ts.id,
    NULL,
    d.dt,
    t.classroom_id,
    ts.subject_id,
    ts.staff_id,
    'regular',
    'completed',
    TIMESTAMP(d.dt, '18:00:00'),
    NULL,
    (SELECT id FROM users WHERE user_id = 'ad'),
    (SELECT id FROM users WHERE user_id = 'ad')
FROM (
    SELECT '2024-09-02' AS dt
    UNION ALL SELECT '2024-09-03' AS dt
    UNION ALL SELECT '2024-09-04' AS dt
    UNION ALL SELECT '2024-09-05' AS dt
    UNION ALL SELECT '2024-09-06' AS dt
    UNION ALL SELECT '2024-09-09' AS dt
    UNION ALL SELECT '2024-09-10' AS dt
    UNION ALL SELECT '2024-09-11' AS dt
    UNION ALL SELECT '2024-09-12' AS dt
    UNION ALL SELECT '2024-09-14' AS dt
) AS d
JOIN timetables t
    ON t.timetable_name LIKE CONCAT('%', ' - September 2024')
   AND t.classroom_id IN (
        SELECT id FROM classrooms WHERE name IN ('1st Year A Sec', '1st Year B Sec', '2nd Year A Sec', '2nd Year B Sec', '3rd Year')
   )
JOIN timetable_slots ts
    ON ts.timetable_id = t.id
JOIN timetable_format_days tfd
    ON tfd.id = ts.day_id
WHERE tfd.day_name = UPPER(DAYNAME(d.dt));


-- ============================================================
-- 11. ATTENDANCE RECORDS
-- ============================================================
-- Every student in each session's classroom gets a record.
-- Only 'present', 'absent' and 'od' are used (attendance_records
-- no longer has 'late', 'leave' or 'excused'). The great
-- majority of records are 'present'; a small, deterministic
-- share are marked 'absent' or 'od' for variety.
-- ============================================================

INSERT INTO attendance_records
(session_id, student_id, attendance_status, check_in_time, remarks)
SELECT
    ases.id,
    st.id,
    CASE
        WHEN MOD(st.id * 7 + DAYOFMONTH(ases.attendance_date) * 3, 20) = 0 THEN 'absent'
        WHEN MOD(st.id * 7 + DAYOFMONTH(ases.attendance_date) * 3, 20) = 1 THEN 'od'
        ELSE 'present'
    END,
    CASE
        WHEN MOD(st.id * 7 + DAYOFMONTH(ases.attendance_date) * 3, 20) NOT IN (0, 1)
            THEN '09:00:00'
        ELSE NULL
    END,
    NULL
FROM attendance_sessions ases
JOIN students st
    ON st.classroom_id = ases.classroom_id
WHERE ases.attendance_date IN (
    '2024-09-02', '2024-09-03', '2024-09-04', '2024-09-05', '2024-09-06', '2024-09-09', '2024-09-10', '2024-09-11', '2024-09-12', '2024-09-14'
);


-- ============================================================
-- SEED DATA COMPLETE
-- ============================================================
