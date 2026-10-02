-- database/seed_academics.sql

-- ============================================================
-- COLLEGE ERP - ACADEMICS SEED DATA (TIMETABLE & ATTENDANCE)
-- ============================================================
-- Assumes schema_core.sql, seed.sql (core seed) and
-- schema_academics.sql have already been executed.
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
-- 10. attendance_sessions (regular + additional classes)
-- 11. attendance_records
--
-- Conventions used in this file:
-- - The current academic term is the KBA "2026-2027 Odd Term"
--   (2026-06-01 to 2026-11-30); "today" for this seed is
--   Tuesday 2026-09-29.
-- - Timetables exist for September 2026 and October 2026 and
--   BOTH are active (is_active = 1, version 1).
-- - Attendance is recorded from Monday 2026-09-21 to Tuesday
--   2026-09-29 (Sunday 2026-09-27 skipped, no holidays in range).
-- - attendance_records uses only 'present', 'absent' and 'od'.
-- ============================================================

-- ============================================================
-- 1. ACADEMIC CALENDAR - INDIAN GOVERNMENT HOLIDAYS
-- ============================================================
-- 10 Indian government holidays from Aug 2026 to Mar 2027.
-- Every holiday affects attendance and applies to all
-- classrooms, so no rows are needed in
-- academic_calendar_classrooms for these.
-- NOTE: festival dates are the commonly published ones; adjust
-- them if your official college calendar differs.
-- ============================================================

INSERT INTO academic_calendar
(calendar_date, event_type, affects_attendance, applies_to_all_classrooms,
 color_id, title, description, created_by, updated_by)
VALUES
('2026-08-15', 'HOLIDAY', 1, 1, NULL, 'Independence Day', 'National holiday - Independence Day', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-09-14', 'HOLIDAY', 1, 1, NULL, 'Ganesh Chaturthi', 'National holiday - Ganesh Chaturthi', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-10-02', 'HOLIDAY', 1, 1, NULL, 'Gandhi Jayanti', 'National holiday - Gandhi Jayanti', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-10-20', 'HOLIDAY', 1, 1, NULL, 'Vijayadashami (Dussehra)', 'National holiday - Vijayadashami (Dussehra)', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-11-08', 'HOLIDAY', 1, 1, NULL, 'Diwali (Deepavali)', 'National holiday - Diwali (Deepavali)', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-11-24', 'HOLIDAY', 1, 1, NULL, 'Guru Nanak Jayanti', 'National holiday - Guru Nanak Jayanti', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-12-25', 'HOLIDAY', 1, 1, NULL, 'Christmas', 'National holiday - Christmas', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2027-01-14', 'HOLIDAY', 1, 1, NULL, 'Makar Sankranti / Pongal', 'National holiday - Makar Sankranti / Pongal', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2027-01-26', 'HOLIDAY', 1, 1, NULL, 'Republic Day', 'National holiday - Republic Day', (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2027-03-22', 'HOLIDAY', 1, 1, NULL, 'Holi', 'National holiday - Holi', (SELECT id FROM users WHERE user_id = 'ad'), NULL);

-- ============================================================
-- 2. ACADEMIC CALENDAR - EXAMS
-- ============================================================
-- 1st & 2nd Year exams and 3rd/4th/5th Year exams are held on
-- different dates and do NOT apply to all classrooms
-- (applies_to_all_classrooms = 0). The exact classrooms each
-- exam affects are recorded separately in
-- academic_calendar_classrooms below.
--
-- Both exams are scheduled in November 2026 (still inside the
-- Odd Term), i.e. AFTER the 21-29 Sep 2026 attendance window,
-- so they do not clash with the attendance seeded below.
--
-- On '1st & 2nd Year Odd Semester Exam' (2026-11-16):
--   - 1st/2nd Year classrooms have no regular attendance.
--   - 3rd, 4th and 5th Year classrooms continue as usual.
-- On '3rd, 4th & 5th Year Odd Semester Exam' (2026-11-18)
-- it is the reverse.
-- ============================================================

INSERT INTO academic_calendar
(calendar_date, event_type, affects_attendance, applies_to_all_classrooms,
 color_id, title, description, created_by, updated_by)
VALUES
('2026-11-16', 'EXAM', 1, 0, NULL,
 '1st & 2nd Year Odd Semester Exam',
 'Odd semester examinations for 1st Year and 2nd Year classrooms',
 (SELECT id FROM users WHERE user_id = 'ad'), NULL),
('2026-11-18', 'EXAM', 1, 0, NULL,
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
-- One timetable per classroom for September 2026 and one for
-- October 2026, for the 5 classrooms that have students and
-- subjects seeded in seed.sql. ALL are active (is_active = 1)
-- and both are version 1, because neither replaces the other:
--   September 2026 : 2026-09-01 -> 2026-09-30
--   October 2026   : 2026-10-01 -> 2026-10-31
-- 4th Year and 5th Year have no batch/students yet, so no
-- timetable is created for them here.
-- ============================================================

INSERT INTO timetables
(timetable_name, classroom_id, academic_term_id, format_id,
 effective_from, effective_to, notes, version, is_active,
 created_by, updated_by)
SELECT
    CONCAT(c.name, ' - ', m.month_label),
    c.id,
    term.id,
    tf.id,
    m.effective_from,
    m.effective_to,
    m.notes,
    1,
    1,
    u.id,
    u.id
FROM classrooms c
JOIN (
    SELECT 'September 2026' AS month_label,
           '2026-09-01' AS effective_from,
           '2026-09-30' AS effective_to,
           'September 2026 timetable' AS notes
    UNION ALL
    SELECT 'October 2026',
           '2026-10-01',
           '2026-10-31',
           'October 2026 timetable - subjects rotated for the new month'
) AS m
JOIN academic_terms term
    ON term.course_id = c.course
   AND term.name = '2026-2027 Odd Term'
JOIN timetable_formats tf
    ON tf.format_name = 'KBA Standard Timetable'
JOIN users u
    ON u.user_id = 'ad'
WHERE c.name IN ('1st Year A Sec', '1st Year B Sec', '2nd Year A Sec', '2nd Year B Sec', '3rd Year')
ORDER BY c.id, m.effective_from;

-- ============================================================
-- 8. TIMETABLE SLOTS
-- ============================================================
-- 8 class periods x 6 days = 48 slots per timetable
-- (10 timetables -> 480 slots). Break and lunch have no slots.
--
-- Each classroom has 5 subjects (seed.sql). Subjects are
-- numbered 0-4 in id order within the classroom, and the
-- subject of a cell is:
--
--     idx = (month_offset + (day_order - 1) + period_position) MOD 5
--
--     period_position : P1 = 0 ... P8 = 7
--     month_offset    : September = 0, October = 2
--
-- so Monday P1 is subject #1 in September but subject #3 in
-- October (the weekly pattern rotates for the new month), and
-- every following day/period shifts by one, exactly as in the
-- previous hand-written blocks. The handling staff of the
-- subject is used as the slot's staff.
-- ============================================================

INSERT INTO timetable_slots
(timetable_id, day_id, period_id, subject_id, staff_id, remarks)
SELECT
    tt.id,
    tfd.id,
    tfp.id,
    subj.id,
    subj.handling_staff_id,
    NULL
FROM timetables tt
JOIN timetable_format_days tfd
    ON tfd.format_id = tt.format_id
JOIN (
    SELECT 'P1' AS period_key, 0 AS pos
    UNION ALL SELECT 'P2', 1
    UNION ALL SELECT 'P3', 2
    UNION ALL SELECT 'P4', 3
    UNION ALL SELECT 'P5', 4
    UNION ALL SELECT 'P6', 5
    UNION ALL SELECT 'P7', 6
    UNION ALL SELECT 'P8', 7
) AS pp
JOIN timetable_format_periods tfp
    ON tfp.format_id = tt.format_id
   AND tfp.period_key = pp.period_key
JOIN (
    SELECT
        s.id,
        s.classroom_id,
        s.handling_staff_id,
        ROW_NUMBER() OVER (PARTITION BY s.classroom_id ORDER BY s.id) - 1 AS idx
    FROM subjects s
) AS subj
    ON subj.classroom_id = tt.classroom_id
WHERE (tt.timetable_name LIKE '% - September 2026'
       OR tt.timetable_name LIKE '% - October 2026')
  AND MOD(
        (CASE WHEN tt.timetable_name LIKE '% - October 2026' THEN 2 ELSE 0 END)
        + tfd.day_order + 4 + pp.pos,
        5
       ) = subj.idx;

-- ============================================================
-- 9. ADDITIONAL CLASSES
-- ============================================================
-- 6 additional classes in the attendance window
-- (2026-09-21 to 2026-09-29): 3 'extra' + 3 'makeup'.
-- All are 'completed' and are held after Period 8 (16:15-17:00).
--
-- Makeup classes replace a period lost to the Ganesh Chaturthi
-- holiday on Monday 2026-09-14 (original_period_no = the class
-- period that was missed on that day, taken from the
-- September 2026 timetable):
--   1st Year A : Mon P3 = AQD-1A
--   1st Year B : Mon P5 = SRH-1B
--   2nd Year B : Mon P4 = FQM-2B
-- ============================================================

INSERT INTO additional_classes
(academic_term_id, classroom_id, subject_id, staff_id, class_date,
 start_time, end_time, class_type, original_class_date,
 original_period_no, reason, status, created_by, updated_by)
VALUES
-- ---------- EXTRA (3) ----------
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '1st Year A Sec'),
    (SELECT id FROM subjects WHERE code = 'QRT-1A'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'QRT-1A'),
    '2026-09-22', '16:15:00', '17:00:00', 'extra',
    NULL, NULL,
    'Extra class for tajweed practice',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'),
    (SELECT id FROM subjects WHERE code = 'HD1-2A'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'HD1-2A'),
    '2026-09-24', '16:15:00', '17:00:00', 'extra',
    NULL, NULL,
    'Extra class for syllabus revision',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '3rd Year'),
    (SELECT id FROM subjects WHERE code = 'UFQ-3'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'UFQ-3'),
    '2026-09-25', '16:15:00', '17:00:00', 'extra',
    NULL, NULL,
    'Extra class for exam preparation',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
-- ---------- MAKEUP (3) ----------
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '1st Year A Sec'),
    (SELECT id FROM subjects WHERE code = 'AQD-1A'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'AQD-1A'),
    '2026-09-23', '16:15:00', '17:00:00', 'makeup',
    '2026-09-14', 3,
    'Makeup class for the period missed on 2026-09-14 (Ganesh Chaturthi holiday)',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'),
    (SELECT id FROM subjects WHERE code = 'FQM-2B'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'FQM-2B'),
    '2026-09-26', '16:15:00', '17:00:00', 'makeup',
    '2026-09-14', 4,
    'Makeup class for the period missed on 2026-09-14 (Ganesh Chaturthi holiday)',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
),
(
    (SELECT id FROM academic_terms WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = '2026-2027 Odd Term'),
    (SELECT id FROM classrooms WHERE name = '1st Year B Sec'),
    (SELECT id FROM subjects WHERE code = 'SRH-1B'),
    (SELECT handling_staff_id FROM subjects WHERE code = 'SRH-1B'),
    '2026-09-28', '16:15:00', '17:00:00', 'makeup',
    '2026-09-14', 5,
    'Makeup class for the period missed on 2026-09-14 (Ganesh Chaturthi holiday)',
    'completed', (SELECT id FROM users WHERE user_id = 'ad'), (SELECT id FROM users WHERE user_id = 'ad')
);

-- ============================================================
-- 10. ATTENDANCE SESSIONS
-- ============================================================
-- (a) REGULAR sessions: one per timetable slot, per classroom,
--     for the 8 school days from 2026-09-21 to 2026-09-29
--     (Mon 21, Tue 22, Wed 23, Thu 24, Fri 25, Sat 26,
--      Mon 28, Tue 29 - Sunday 27 skipped; no holiday in
--     range). Uses the September 2026 timetables. No exam falls
--     in this range.
-- (b) ADDITIONAL-CLASS sessions: one per row in
--     additional_classes (3 extra + 3 makeup), linked through
--     additional_class_id (timetable_slot_id stays NULL, as
--     required by chk_as_source / chk_as_session_type).
-- ============================================================

-- (a) regular sessions
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
    SELECT '2026-09-21' AS dt
    UNION ALL SELECT '2026-09-22'
    UNION ALL SELECT '2026-09-23'
    UNION ALL SELECT '2026-09-24'
    UNION ALL SELECT '2026-09-25'
    UNION ALL SELECT '2026-09-26'
    UNION ALL SELECT '2026-09-28'
    UNION ALL SELECT '2026-09-29'
) AS d
JOIN timetables t
    ON t.timetable_name LIKE '% - September 2026'
   AND t.is_active = 1
   AND d.dt BETWEEN t.effective_from AND t.effective_to
   AND t.classroom_id IN (
        SELECT id FROM classrooms WHERE name IN ('1st Year A Sec', '1st Year B Sec', '2nd Year A Sec', '2nd Year B Sec', '3rd Year')
   )
JOIN timetable_slots ts
    ON ts.timetable_id = t.id
JOIN timetable_format_days tfd
    ON tfd.id = ts.day_id
WHERE tfd.day_name = UPPER(DAYNAME(d.dt));

-- (b) sessions for the additional classes (extra + makeup)
INSERT INTO attendance_sessions
(academic_term_id, timetable_slot_id, additional_class_id, attendance_date,
 classroom_id, subject_id, staff_id, session_type, session_status,
 submitted_at, remarks, created_by, updated_by)
SELECT
    ac.academic_term_id,
    NULL,
    ac.id,
    ac.class_date,
    ac.classroom_id,
    ac.subject_id,
    ac.staff_id,
    ac.class_type,
    'completed',
    TIMESTAMP(ac.class_date, '17:30:00'),
    ac.reason,
    (SELECT id FROM users WHERE user_id = 'ad'),
    (SELECT id FROM users WHERE user_id = 'ad')
FROM additional_classes ac
WHERE ac.status = 'completed'
  AND ac.class_date BETWEEN '2026-09-21' AND '2026-09-29';


-- ============================================================
-- 11. ATTENDANCE RECORDS
-- ============================================================
-- Every student in each session's classroom gets a record.
-- Only 'present', 'absent' and 'od' are used. The great
-- majority of records are 'present'; a small, deterministic
-- share are marked 'absent' or 'od' for variety (a student's
-- status is the same for every session on a given day).
-- check_in_time is the start time of the period (regular
-- sessions) or of the additional class; NULL for absent / od.
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
            THEN COALESCE(tfp.start_time, ac.start_time)
        ELSE NULL
    END,
    NULL
FROM attendance_sessions ases
JOIN students st
    ON st.classroom_id = ases.classroom_id
LEFT JOIN timetable_slots ts
    ON ts.id = ases.timetable_slot_id
LEFT JOIN timetable_format_periods tfp
    ON tfp.id = ts.period_id
LEFT JOIN additional_classes ac
    ON ac.id = ases.additional_class_id
WHERE ases.attendance_date BETWEEN '2026-09-21' AND '2026-09-29';


-- ============================================================
-- SEED DATA COMPLETE
-- ============================================================
