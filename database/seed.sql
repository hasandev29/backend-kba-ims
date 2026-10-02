-- database/seed.sql

-- ============================================================
-- COLLEGE ERP - SEED DATA
-- ============================================================
-- Assumes schema.sql has already been executed.
--
-- Seed order:
-- 1.  batches
-- 1B. courses
-- 1C. semesters
-- 2.  users
-- 3.  classrooms
-- 4.  staff
-- 5.  staff_employment_details
-- 6.  staff_qualifications
-- 7.  staff_addresses
-- 8.  staff_other_details
-- 9.  students
-- 10. student_other_details
-- 11. student_academic_details
-- 12. student_family_details
-- 13. student_addresses
-- 14. student_qualifications
-- 15. student_extra_qualifications
-- 16. student_admission_details
-- 17. student_related_links
--
-- ============================================================


-- ============================================================
-- 1. BATCHES
-- ============================================================

INSERT INTO batches
(course, batch_name, start_year, end_year)
VALUES
('KBA', '2021 Batch', 2021, 2026),
('KBA', '2022 Batch', 2022, 2027),
('Arabic Diploma', '2023 - 2024 Batch', 2023, 2024);


-- ============================================================
-- 1B. COURSES
-- ============================================================

INSERT INTO courses
(name)
VALUES
('KBA'),
('Arabic Diploma'),
('Certificate Course');


-- ============================================================
-- 1C. SEMESTERS
-- ============================================================

INSERT INTO semesters
(course_id, name, sem_order)
VALUES

-- ----------------------------
-- KBA (6 semesters)
-- ----------------------------

((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 1', 1),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 2', 2),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 3', 3),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 4', 4),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 5', 5),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 6', 6),

-- ----------------------------
-- Arabic Diploma (2 semesters)
-- ----------------------------

((SELECT id FROM courses WHERE name = 'Arabic Diploma'), 'Sem 1', 1),
((SELECT id FROM courses WHERE name = 'Arabic Diploma'), 'Sem 2', 2),

-- ----------------------------
-- Certificate Course (2 semesters)
-- ----------------------------

((SELECT id FROM courses WHERE name = 'Certificate Course'), 'Sem 1', 1),
((SELECT id FROM courses WHERE name = 'Certificate Course'), 'Sem 2', 2);


-- ============================================================
-- 2. USERS
-- ============================================================
-- Staff:
-- kba001 -> $2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> $2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe:$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 21$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 21$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 22$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 22$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 23$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe -> 23$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe:
-- Passwords below are plain-text seed values as requested.
-- If your application expects bcrypt hashes in the users table,
-- replace these with bcrypt hashes before using this in production.
-- ============================================================

INSERT INTO users
(user_id, email, role, status, password)
VALUES

('ad', 'ad@college.edu', 'admin', 'active', '$2b$10$6eEPkFA3l9xRxZ3Q9FksIeA5v93p6LLCLkDcVpthDYPLhUUnRNYoe'),
('sa', 'sa@college.edu', 'superadmin', 'active', '$2b$10$zA45IBkve0ZQg/tVU0uJ/e2iuSMf0JdPpLYj6OIkIV7O987a6r4UC'),
('dev', 'dev@college.edu', 'dev', 'active', '$2b$10$pie/g9XfqsTxy/npaxt93u8T0Ec8CpqU0RRAfGyhv33OrvAVtnd0q'),
('ac', 'ac@college.edu', 'accountant', 'active', '$2b$10$JETuSOM60eycdH1VwXLHC.3NJNY9kNpNrzFWMnzWpOvf/5TdxtJMy'),
('pa', 'pa@college.edu', 'parent', 'active', '$2b$10$PCB5uZYSvnOViMUOCi3NAOv857FRZg3reue5l5n.sTC040zA/GxEO'),


-- ----------------------------
-- STAFF USERS
-- ----------------------------

('kba001', 'kba001@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba002', 'kba002@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba003', 'kba003@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba004', 'kba004@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba005', 'kba005@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba006', 'kba006@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba007', 'kba007@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba008', 'kba008@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba009', 'kba009@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba010', 'kba010@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba011', 'kba011@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba012', 'kba012@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba013', 'kba013@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba014', 'kba014@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),
('kba015', 'kba015@college.edu', 'staff', 'active', '$2b$10$StB8UwEv3yFsG2k3HLEC1.dul92Yyj2AOEonbJnuT7YFarKjUlnRe'),

-- ----------------------------
-- 2021 BATCH STUDENTS
-- ----------------------------

('2101', '2101@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2102', '2102@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2103', '2103@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2104', '2104@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2105', '2105@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2106', '2106@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2107', '2107@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2108', '2108@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2109', '2109@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2110', '2110@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2111', '2111@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2112', '2112@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2113', '2113@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),

-- ----------------------------
-- 2022 BATCH STUDENTS
-- ----------------------------

('2201', '2201@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2202', '2202@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2203', '2203@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2204', '2204@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2205', '2205@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2206', '2206@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2207', '2207@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2208', '2208@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2209', '2209@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2210', '2210@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2211', '2211@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2212', '2212@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2213', '2213@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),

-- ----------------------------
-- 2023 BATCH STUDENTS
-- ----------------------------

('2301', '2301@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2302', '2302@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2303', '2303@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2304', '2304@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2305', '2305@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2306', '2306@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2307', '2307@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2308', '2308@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2309', '2309@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2310', '2310@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2311', '2311@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2312', '2312@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2313', '2313@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2314', '2314@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi');


-- ============================================================
-- 3. CLASSROOMS
-- ============================================================
-- 5 years
-- 2 sections per year (A and B)
-- 2 terms per classroom
-- Course = 1
--
-- Semester mapping:
-- Year 1 -> Semesters 1 and 2
-- Year 2 -> Semesters 3 and 4
-- Year 3 -> Semesters 5 and 6
-- Year 4 -> Semesters 1 and 2
-- Year 5 -> Semesters 3 and 4
--
-- This creates 20 classrooms.
-- ============================================================

INSERT INTO classrooms
(name, room_no, semester, advisor_id, leader_id, batch_id, course, is_active)
VALUES

-- ----------------------------
-- 1 YEAR
-- ----------------------------

('1 Year A Sec', '101', 1, 1, NULL, NULL, 1, 1, 1),
('1 Year A Sec', '101', 2, 2, NULL, NULL, 1, 1, 1),
('1 Year B Sec', '102', 1, 1, NULL, NULL, 1, 1, 1),
('1 Year B Sec', '102', 2, 2, NULL, NULL, 1, 1, 1),

-- ----------------------------
-- 2 YEAR
-- ----------------------------

('2 Year A Sec', '201', 1, 3, NULL, NULL, 2, 1, 1),
('2 Year A Sec', '201', 2, 4, NULL, NULL, 2, 1, 1),
('2 Year B Sec', '202', 1, 3, NULL, NULL, 2, 1, 1),
('2 Year B Sec', '202', 2, 4, NULL, NULL, 2, 1, 1),

-- ----------------------------
-- 3 YEAR
-- ----------------------------

('3 Year A Sec', '301', 1, 5, NULL, NULL, 3, 1, 1),
('3 Year A Sec', '301', 2, 6, NULL, NULL, 3, 1, 1),
('3 Year B Sec', '302', 1, 5, NULL, NULL, 3, 1, 1),
('3 Year B Sec', '302', 2, 6, NULL, NULL, 3, 1, 1),

-- ----------------------------
-- 4 YEAR
-- ----------------------------

('4 Year A Sec', '401', 1, 1, NULL, NULL, 3, 1, 1),
('4 Year A Sec', '401', 2, 2, NULL, NULL, 3, 1, 1),
('4 Year B Sec', '402', 1, 1, NULL, NULL, 3, 1, 1),
('4 Year B Sec', '402', 2, 2, NULL, NULL, 3, 1, 1),

-- ----------------------------
-- 5 YEAR
-- ----------------------------

('5 Year A Sec', '501', 1, 3, NULL, NULL, 3, 1, 1),
('5 Year A Sec', '501', 2, 4, NULL, NULL, 3, 1, 1),
('5 Year B Sec', '502', 1, 3, NULL, NULL, 3, 1, 1),
('5 Year B Sec', '502', 2, 4, NULL, NULL, 3, 1, 1);


-- ============================================================
-- 3B. SUBJECTS
-- ============================================================
-- All subjects are Islamic-studies related.
-- course = 1 for all rows.
-- sem ranges 1-6, term is 1 or 2, matched to each
-- classroom's own sem/term so classroom_id assignment is valid.
-- 3 subjects per classroom.
-- ============================================================

INSERT INTO subjects
(code, name, display_name, book_name, description,
 course, semester, term, credits, univ_credits, classroom_id,
 course_staff_id, handling_staff_id, is_active)
VALUES

-- ---------------- SEM 1 / TERM 1 (classrooms 1, 3, 13, 15) ----------------

('QR1-C1',  'Quran Recitation Level 1',      'Quran Class 1',        'Tajweed Basics',            'Learn basic tajweed and recitation rules',                 1, 1, 1, 3.0, 3.0, 1,  NULL, NULL, 1),
('AG1-C1',  'Arabic Grammar Basics',         'Al-Nahw Al-Asasi',      'Al-Nahw Al-Wadih',          'Introduction to Arabic grammar (Nahw)',                    1, 1, 1, 3.0, 3.0, 1,  NULL, NULL, 1),
('AQ1-C1',  'Islamic Beliefs Foundations',   'Usul al-Din',           'Aqeedah al-Tahawiyyah',     'Foundational Islamic beliefs and creed',                   1, 1, 1, 3.0, 3.0, 1,  NULL, NULL, 1),

('QR1-C3',  'Quran Recitation Level 1',      'Quran Class 1',        'Tajweed Basics',            'Learn basic tajweed and recitation rules',                 1, 1, 1, 3.0, 3.0, 3,  NULL, NULL, 1),
('AG1-C3',  'Arabic Grammar Basics',         'Al-Nahw Al-Asasi',      'Al-Nahw Al-Wadih',          'Introduction to Arabic grammar (Nahw)',                    1, 1, 1, 3.0, 3.0, 3,  NULL, NULL, 1),
('AQ1-C3',  'Islamic Beliefs Foundations',   'Usul al-Din',           'Aqeedah al-Tahawiyyah',     'Foundational Islamic beliefs and creed',                   1, 1, 1, 3.0, 3.0, 3,  NULL, NULL, 1),

('QR1-C13', 'Quran Recitation Level 1',      'Quran Class 1',        'Tajweed Basics',            'Learn basic tajweed and recitation rules',                 1, 1, 1, 3.0, 3.0, 13, NULL, NULL, 1),
('AG1-C13', 'Arabic Grammar Basics',         'Al-Nahw Al-Asasi',      'Al-Nahw Al-Wadih',          'Introduction to Arabic grammar (Nahw)',                    1, 1, 1, 3.0, 3.0, 13, NULL, NULL, 1),
('AQ1-C13', 'Islamic Beliefs Foundations',   'Usul al-Din',           'Aqeedah al-Tahawiyyah',     'Foundational Islamic beliefs and creed',                   1, 1, 1, 3.0, 3.0, 13, NULL, NULL, 1),

('QR1-C15', 'Quran Recitation Level 1',      'Quran Class 1',        'Tajweed Basics',            'Learn basic tajweed and recitation rules',                 1, 1, 1, 3.0, 3.0, 15, NULL, NULL, 1),
('AG1-C15', 'Arabic Grammar Basics',         'Al-Nahw Al-Asasi',      'Al-Nahw Al-Wadih',          'Introduction to Arabic grammar (Nahw)',                    1, 1, 1, 3.0, 3.0, 15, NULL, NULL, 1),
('AQ1-C15', 'Islamic Beliefs Foundations',   'Usul al-Din',           'Aqeedah al-Tahawiyyah',     'Foundational Islamic beliefs and creed',                   1, 1, 1, 3.0, 3.0, 15, NULL, NULL, 1),

-- ---------------- SEM 2 / TERM 2 (classrooms 2, 4, 14, 16) ----------------

('TF1-C2',  'Tafsir Introduction',           'Introduction to Tafsir','Tafsir al-Jalalayn',        'Introduction to Quranic exegesis',                         1, 2, 2, 3.0, 3.0, 2,  NULL, NULL, 1),
('SR1-C2',  'Arabic Morphology',             'Al-Sarf',               'Al-Tasrif al-Izzi',         'Study of Arabic word formation (Sarf)',                    1, 2, 2, 3.0, 3.0, 2,  NULL, NULL, 1),
('SE1-C2',  'Seerah of the Prophet',         'Prophetic Biography',   'Al-Raheeq Al-Makhtum',      'Life and biography of Prophet Muhammad (PBUH)',            1, 2, 2, 3.0, 3.0, 2,  NULL, NULL, 1),

('TF1-C4',  'Tafsir Introduction',           'Introduction to Tafsir','Tafsir al-Jalalayn',        'Introduction to Quranic exegesis',                         1, 2, 2, 3.0, 3.0, 4,  NULL, NULL, 1),
('SR1-C4',  'Arabic Morphology',             'Al-Sarf',               'Al-Tasrif al-Izzi',         'Study of Arabic word formation (Sarf)',                    1, 2, 2, 3.0, 3.0, 4,  NULL, NULL, 1),
('SE1-C4',  'Seerah of the Prophet',         'Prophetic Biography',   'Al-Raheeq Al-Makhtum',      'Life and biography of Prophet Muhammad (PBUH)',            1, 2, 2, 3.0, 3.0, 4,  NULL, NULL, 1),

('TF1-C14', 'Tafsir Introduction',           'Introduction to Tafsir','Tafsir al-Jalalayn',        'Introduction to Quranic exegesis',                         1, 2, 2, 3.0, 3.0, 14, NULL, NULL, 1),
('SR1-C14', 'Arabic Morphology',             'Al-Sarf',               'Al-Tasrif al-Izzi',         'Study of Arabic word formation (Sarf)',                    1, 2, 2, 3.0, 3.0, 14, NULL, NULL, 1),
('SE1-C14', 'Seerah of the Prophet',         'Prophetic Biography',   'Al-Raheeq Al-Makhtum',      'Life and biography of Prophet Muhammad (PBUH)',            1, 2, 2, 3.0, 3.0, 14, NULL, NULL, 1),

('TF1-C16', 'Tafsir Introduction',           'Introduction to Tafsir','Tafsir al-Jalalayn',        'Introduction to Quranic exegesis',                         1, 2, 2, 3.0, 3.0, 16, NULL, NULL, 1),
('SR1-C16', 'Arabic Morphology',             'Al-Sarf',               'Al-Tasrif al-Izzi',         'Study of Arabic word formation (Sarf)',                    1, 2, 2, 3.0, 3.0, 16, NULL, NULL, 1),
('SE1-C16', 'Seerah of the Prophet',         'Prophetic Biography',   'Al-Raheeq Al-Makhtum',      'Life and biography of Prophet Muhammad (PBUH)',            1, 2, 2, 3.0, 3.0, 16, NULL, NULL, 1),

-- ---------------- SEM 3 / TERM 1 (classrooms 5, 7, 17, 19) ----------------

('HD1-C5',  'Hadith Studies I',              'Introduction to Hadith','Riyadh al-Saliheen',        'Study of Prophetic traditions',                            1, 3, 1, 3.0, 3.0, 5,  NULL, NULL, 1),
('FQ1-C5',  'Fiqh Fundamentals',             'Islamic Jurisprudence Basics', 'Al-Fiqh al-Muyassar','Fundamentals of Islamic law',                              1, 3, 1, 3.0, 3.0, 5,  NULL, NULL, 1),
('AL1-C5',  'Arabic Literature I',           'Al-Adab Al-Arabi',      'Diwan al-Mutanabbi',        'Classical Arabic literature and poetry',                   1, 3, 1, 3.0, 3.0, 5,  NULL, NULL, 1),

('HD1-C7',  'Hadith Studies I',              'Introduction to Hadith','Riyadh al-Saliheen',        'Study of Prophetic traditions',                            1, 3, 1, 3.0, 3.0, 7,  NULL, NULL, 1),
('FQ1-C7',  'Fiqh Fundamentals',             'Islamic Jurisprudence Basics', 'Al-Fiqh al-Muyassar','Fundamentals of Islamic law',                              1, 3, 1, 3.0, 3.0, 7,  NULL, NULL, 1),
('AL1-C7',  'Arabic Literature I',           'Al-Adab Al-Arabi',      'Diwan al-Mutanabbi',        'Classical Arabic literature and poetry',                   1, 3, 1, 3.0, 3.0, 7,  NULL, NULL, 1),

('HD1-C17', 'Hadith Studies I',              'Introduction to Hadith','Riyadh al-Saliheen',        'Study of Prophetic traditions',                            1, 3, 1, 3.0, 3.0, 17, NULL, NULL, 1),
('FQ1-C17', 'Fiqh Fundamentals',             'Islamic Jurisprudence Basics', 'Al-Fiqh al-Muyassar','Fundamentals of Islamic law',                              1, 3, 1, 3.0, 3.0, 17, NULL, NULL, 1),
('AL1-C17', 'Arabic Literature I',           'Al-Adab Al-Arabi',      'Diwan al-Mutanabbi',        'Classical Arabic literature and poetry',                   1, 3, 1, 3.0, 3.0, 17, NULL, NULL, 1),

('HD1-C19', 'Hadith Studies I',              'Introduction to Hadith','Riyadh al-Saliheen',        'Study of Prophetic traditions',                            1, 3, 1, 3.0, 3.0, 19, NULL, NULL, 1),
('FQ1-C19', 'Fiqh Fundamentals',             'Islamic Jurisprudence Basics', 'Al-Fiqh al-Muyassar','Fundamentals of Islamic law',                              1, 3, 1, 3.0, 3.0, 19, NULL, NULL, 1),
('AL1-C19', 'Arabic Literature I',           'Al-Adab Al-Arabi',      'Diwan al-Mutanabbi',        'Classical Arabic literature and poetry',                   1, 3, 1, 3.0, 3.0, 19, NULL, NULL, 1),

-- ---------------- SEM 4 / TERM 2 (classrooms 6, 8, 18, 20) ----------------

('HD2-C6',  'Hadith Studies II',             'Advanced Hadith Studies', 'Sahih al-Bukhari (Selections)', 'Advanced study of Prophetic traditions',            1, 4, 2, 3.0, 3.0, 6,  NULL, NULL, 1),
('UF1-C6',  'Usul al-Fiqh',                  'Principles of Islamic Jurisprudence', 'Al-Waraqat',    'Methodology of Islamic legal reasoning',                   1, 4, 2, 3.0, 3.0, 6,  NULL, NULL, 1),
('AL2-C6',  'Arabic Literature II',          'Al-Adab Al-Arabi II',   'Maqamat al-Hariri',         'Advanced Arabic literature and rhetoric',                  1, 4, 2, 3.0, 3.0, 6,  NULL, NULL, 1),

('HD2-C8',  'Hadith Studies II',             'Advanced Hadith Studies', 'Sahih al-Bukhari (Selections)', 'Advanced study of Prophetic traditions',            1, 4, 2, 3.0, 3.0, 8,  NULL, NULL, 1),
('UF1-C8',  'Usul al-Fiqh',                  'Principles of Islamic Jurisprudence', 'Al-Waraqat',    'Methodology of Islamic legal reasoning',                   1, 4, 2, 3.0, 3.0, 8,  NULL, NULL, 1),
('AL2-C8',  'Arabic Literature II',          'Al-Adab Al-Arabi II',   'Maqamat al-Hariri',         'Advanced Arabic literature and rhetoric',                  1, 4, 2, 3.0, 3.0, 8,  NULL, NULL, 1),

('HD2-C18', 'Hadith Studies II',             'Advanced Hadith Studies', 'Sahih al-Bukhari (Selections)', 'Advanced study of Prophetic traditions',            1, 4, 2, 3.0, 3.0, 18, NULL, NULL, 1),
('UF1-C18', 'Usul al-Fiqh',                  'Principles of Islamic Jurisprudence', 'Al-Waraqat',    'Methodology of Islamic legal reasoning',                   1, 4, 2, 3.0, 3.0, 18, NULL, NULL, 1),
('AL2-C18', 'Arabic Literature II',          'Al-Adab Al-Arabi II',   'Maqamat al-Hariri',         'Advanced Arabic literature and rhetoric',                  1, 4, 2, 3.0, 3.0, 18, NULL, NULL, 1),

('HD2-C20', 'Hadith Studies II',             'Advanced Hadith Studies', 'Sahih al-Bukhari (Selections)', 'Advanced study of Prophetic traditions',            1, 4, 2, 3.0, 3.0, 20, NULL, NULL, 1),
('UF1-C20', 'Usul al-Fiqh',                  'Principles of Islamic Jurisprudence', 'Al-Waraqat',    'Methodology of Islamic legal reasoning',                   1, 4, 2, 3.0, 3.0, 20, NULL, NULL, 1),
('AL2-C20', 'Arabic Literature II',          'Al-Adab Al-Arabi II',   'Maqamat al-Hariri',         'Advanced Arabic literature and rhetoric',                  1, 4, 2, 3.0, 3.0, 20, NULL, NULL, 1),

-- ---------------- SEM 5 / TERM 1 (classrooms 9, 11) ----------------

('CF1-C9',  'Comparative Fiqh',              'Fiqh Muqaran',          'Bidayat al-Mujtahid',       'Comparative study of Islamic legal schools',               1, 5, 1, 3.0, 3.0, 9,  NULL, NULL, 1),
('TA1-C9',  'Quranic Exegesis Advanced',     'Tafsir Advanced',       'Tafsir Ibn Kathir',         'Advanced Quranic exegesis and interpretation',             1, 5, 1, 3.0, 3.0, 9,  NULL, NULL, 1),
('IH1-C9',  'Islamic History',               'Tarikh al-Islam',       'Al-Bidayah wal Nihayah',    'History of Islamic civilization',                          1, 5, 1, 3.0, 3.0, 9,  NULL, NULL, 1),

('CF1-C11', 'Comparative Fiqh',              'Fiqh Muqaran',          'Bidayat al-Mujtahid',       'Comparative study of Islamic legal schools',               1, 5, 1, 3.0, 3.0, 11, NULL, NULL, 1),
('TA1-C11', 'Quranic Exegesis Advanced',     'Tafsir Advanced',       'Tafsir Ibn Kathir',         'Advanced Quranic exegesis and interpretation',             1, 5, 1, 3.0, 3.0, 11, NULL, NULL, 1),
('IH1-C11', 'Islamic History',               'Tarikh al-Islam',       'Al-Bidayah wal Nihayah',    'History of Islamic civilization',                          1, 5, 1, 3.0, 3.0, 11, NULL, NULL, 1),

-- ---------------- SEM 6 / TERM 2 (classrooms 10, 12) ----------------

('FR1-C10', 'Islamic Jurisprudence Research','Bahth al-Fiqh',         'Manahij al-Bahth al-Fiqhi', 'Research methodology in Islamic jurisprudence',            1, 6, 2, 3.0, 3.0, 10, NULL, NULL, 1),
('MH1-C10', 'Hadith Sciences',               'Ulum al-Hadith',        'Nuzhat al-Nazar',           'Sciences of Hadith classification and authentication',     1, 6, 2, 3.0, 3.0, 10, NULL, NULL, 1),
('DA1-C10', 'Dawah and Communication',       'Dawah wal Ittisal',     'Fiqh al-Dawah',             'Islamic outreach and communication skills',                1, 6, 2, 3.0, 3.0, 10, NULL, NULL, 1),

('FR1-C12', 'Islamic Jurisprudence Research','Bahth al-Fiqh',         'Manahij al-Bahth al-Fiqhi', 'Research methodology in Islamic jurisprudence',            1, 6, 2, 3.0, 3.0, 12, NULL, NULL, 1),
('MH1-C12', 'Hadith Sciences',               'Ulum al-Hadith',        'Nuzhat al-Nazar',           'Sciences of Hadith classification and authentication',     1, 6, 2, 3.0, 3.0, 12, NULL, NULL, 1),
('DA1-C12', 'Dawah and Communication',       'Dawah wal Ittisal',     'Fiqh al-Dawah',             'Islamic outreach and communication skills',                1, 6, 2, 3.0, 3.0, 12, NULL, NULL, 1);

-- ============================================================
-- 4. STAFF
-- ============================================================
-- 15 staff
-- All Muslim
-- Only 2 female
--
-- user_id is obtained from users.id using user_id value.
-- staff_uid = users.user_id
--
-- Photo URLs use RandomUser public images for testing.
-- ============================================================

INSERT INTO staff
(user_id, staff_uid, name, short_name, salutation, gender,
 dob, blood_group, mobile_number, emergency_contact,
 personal_email, religion_id, marital_status, medical_remarks,
 photo_url, date_of_joining)
VALUES

(
    (SELECT id FROM users WHERE user_id = 'kba001'),
    'kba001',
    'Abdul Kareem',
    'A. Kareem',
    1,
    1,
    '1982-03-15',
    1,
    '9000000001',
    '9000001001',
    'abdulkareem@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/1.jpg',
    '2012-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba002'),
    'kba002',
    'Muhammad Salman',
    'M. Salman',
    1,
    1,
    '1985-07-22',
    2,
    '9000000002',
    '9000001002',
    'muhammadsalman@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/2.jpg',
    '2014-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba003'),
    'kba003',
    'Abdullah Farooq',
    'A. Farooq',
    1,
    1,
    '1979-11-10',
    3,
    '9000000003',
    '9000001003',
    'abdullahfarooq@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/3.jpg',
    '2010-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba004'),
    'kba004',
    'Ibrahim Hassan',
    'I. Hassan',
    1,
    1,
    '1988-01-25',
    4,
    '9000000004',
    '9000001004',
    'ibrahimhassan@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/4.jpg',
    '2016-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba005'),
    'kba005',
    'Yusuf Ahmed',
    'Y. Ahmed',
    1,
    1,
    '1981-05-18',
    1,
    '9000000005',
    '9000001005',
    'yusufahmed@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/5.jpg',
    '2013-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba006'),
    'kba006',
    'Omar Abdullah',
    'O. Abdullah',
    1,
    1,
    '1987-09-03',
    2,
    '9000000006',
    '9000001006',
    'omarabdullah@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/6.jpg',
    '2015-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba007'),
    'kba007',
    'Hamza Rahman',
    'H. Rahman',
    1,
    1,
    '1990-12-11',
    3,
    '9000000007',
    '9000001007',
    'hamzarahman@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/7.jpg',
    '2018-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba008'),
    'kba008',
    'Bilal Mahmood',
    'B. Mahmood',
    1,
    1,
    '1984-02-28',
    4,
    '9000000008',
    '9000001008',
    'bilalmahmood@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/8.jpg',
    '2014-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba009'),
    'kba009',
    'Ammar Siddiq',
    'A. Siddiq',
    1,
    1,
    '1986-08-19',
    1,
    '9000000009',
    '9000001009',
    'ammarsiddiq@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/9.jpg',
    '2015-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba010'),
    'kba010',
    'Fahad Nazeer',
    'F. Nazeer',
    1,
    1,
    '1991-04-07',
    2,
    '9000000010',
    '9000001010',
    'fahadnazeer@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/10.jpg',
    '2019-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba011'),
    'kba011',
    'Anees Kareem',
    'A. Kareem',
    1,
    1,
    '1983-10-14',
    3,
    '9000000011',
    '9000001011',
    'aneeskareem@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/11.jpg',
    '2012-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba012'),
    'kba012',
    'Saifullah Khan',
    'S. Khan',
    1,
    1,
    '1989-06-23',
    4,
    '9000000012',
    '9000001012',
    'saifullahkhan@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/12.jpg',
    '2017-06-01'
),

-- FEMALE STAFF 1

(
    (SELECT id FROM users WHERE user_id = 'kba013'),
    'kba013',
    'Ayesha Rahman',
    'A. Rahman',
    1,
    2,
    '1987-03-12',
    1,
    '9000000013',
    '9000001013',
    'ayesharahman@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/women/13.jpg',
    '2016-06-01'
),

-- FEMALE STAFF 2

(
    (SELECT id FROM users WHERE user_id = 'kba014'),
    'kba014',
    'Maryam Hassan',
    'M. Hassan',
    1,
    2,
    '1990-09-27',
    2,
    '9000000014',
    '9000001014',
    'maryamhassan@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/women/14.jpg',
    '2018-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba015'),
    'kba015',
    'Zaid Ibrahim',
    'Z. Ibrahim',
    1,
    1,
    '1985-12-05',
    3,
    '9000000015',
    '9000001015',
    'zaidibrahim@college.edu',
    1,
    1,
    NULL,
    'https://randomuser.me/api/portraits/men/15.jpg',
    '2014-06-01'
);


-- ============================================================
-- 5. STAFF EMPLOYMENT DETAILS
-- ============================================================
-- designation and university_designation are INT UNSIGNED.
-- Numeric values are used as placeholder IDs.
-- ============================================================

INSERT INTO staff_employment_details
(staff_id, staff_type, designation, experience_years,
 employment_nature, employment_place, university_id,
 university_designation, university_experience, work_email, notes)
SELECT
    id,
    1,
    CASE staff_uid
        WHEN 'kba001' THEN 1
        WHEN 'kba002' THEN 2
        WHEN 'kba003' THEN 3
        WHEN 'kba004' THEN 2
        WHEN 'kba005' THEN 4
        WHEN 'kba006' THEN 3
        WHEN 'kba007' THEN 2
        WHEN 'kba008' THEN 4
        WHEN 'kba009' THEN 2
        WHEN 'kba010' THEN 3
        WHEN 'kba011' THEN 2
        WHEN 'kba012' THEN 4
        WHEN 'kba013' THEN 2
        WHEN 'kba014' THEN 3
        WHEN 'kba015' THEN 2
    END,
    CASE staff_uid
        WHEN 'kba001' THEN 12.0
        WHEN 'kba002' THEN 10.0
        WHEN 'kba003' THEN 15.0
        WHEN 'kba004' THEN 8.0
        WHEN 'kba005' THEN 11.0
        WHEN 'kba006' THEN 9.0
        WHEN 'kba007' THEN 7.0
        WHEN 'kba008' THEN 10.0
        WHEN 'kba009' THEN 8.0
        WHEN 'kba010' THEN 6.0
        WHEN 'kba011' THEN 12.0
        WHEN 'kba012' THEN 9.0
        WHEN 'kba013' THEN 8.0
        WHEN 'kba014' THEN 6.0
        WHEN 'kba015' THEN 10.0
    END,
    1,
    1,
    NULL,
    CASE staff_uid
        WHEN 'kba001' THEN 1
        WHEN 'kba002' THEN 2
        WHEN 'kba003' THEN 3
        WHEN 'kba004' THEN 2
        WHEN 'kba005' THEN 4
        WHEN 'kba006' THEN 3
        WHEN 'kba007' THEN 2
        WHEN 'kba008' THEN 4
        WHEN 'kba009' THEN 2
        WHEN 'kba010' THEN 3
        WHEN 'kba011' THEN 2
        WHEN 'kba012' THEN 4
        WHEN 'kba013' THEN 2
        WHEN 'kba014' THEN 3
        WHEN 'kba015' THEN 2
    END,
    5.0,
    CONCAT(staff_uid, '@college.edu'),
    'Seed data'
FROM staff
ORDER BY id;


-- ============================================================
-- 6. STAFF QUALIFICATIONS
-- ============================================================

INSERT INTO staff_qualifications
(staff_id, qualifications)
SELECT
    id,
    CASE staff_uid
        WHEN 'kba001' THEN 'MA Islamic Studies, MPhil'
        WHEN 'kba002' THEN 'MA Arabic, B.Ed'
        WHEN 'kba003' THEN 'MA Islamic Studies, PhD'
        WHEN 'kba004' THEN 'MA Quranic Studies'
        WHEN 'kba005' THEN 'MA Hadith Studies, MPhil'
        WHEN 'kba006' THEN 'MA Arabic Literature'
        WHEN 'kba007' THEN 'MA Islamic Jurisprudence'
        WHEN 'kba008' THEN 'MA Quranic Sciences, MPhil'
        WHEN 'kba009' THEN 'MA Islamic Studies'
        WHEN 'kba010' THEN 'MA Arabic'
        WHEN 'kba011' THEN 'MA Hadith Studies, PhD'
        WHEN 'kba012' THEN 'MA Islamic History'
        WHEN 'kba013' THEN 'MA Islamic Studies, B.Ed'
        WHEN 'kba014' THEN 'MA Arabic, MPhil'
        WHEN 'kba015' THEN 'MA Islamic Jurisprudence, MPhil'
    END
FROM staff
ORDER BY id;


-- ============================================================
-- 7. STAFF ADDRESSES
-- ============================================================
-- address_type:
-- 0 = Present Address
-- 1 = Permanent Address
--
-- Every staff member receives both addresses.
-- ============================================================

INSERT INTO staff_addresses
(staff_id, address_type, door_no, street, area, city,
 district, state, pin_code, country)
SELECT
    id,
    0,
    CONCAT(id, '-A'),
    'College Road',
    'Islamic Nagar',
    'Chennai',
    'Chennai',
    'Tamil Nadu',
    '600001',
    'India'
FROM staff;

INSERT INTO staff_addresses
(staff_id, address_type, door_no, street, area, city,
 district, state, pin_code, country)
SELECT
    id,
    1,
    CONCAT(id, '-B'),
    'Main Road',
    'Muslim Nagar',
    'Chennai',
    'Chennai',
    'Tamil Nadu',
    '600002',
    'India'
FROM staff;


-- ============================================================
-- 8. STAFF OTHER DETAILS
-- ============================================================

INSERT INTO staff_other_details
(staff_id, aadhar_no, aadhar_doc_url, pan_no, pan_doc_url)
SELECT
    id,
    CONCAT('90000000', LPAD(id, 4, '0')),
    NULL,
    CONCAT('ABCDE', LPAD(id, 4, '0'), 'F'),
    NULL
FROM staff;


-- ============================================================
-- 9. STUDENTS
-- ============================================================
-- 40 students
-- All male
-- All Muslim
-- All hostel students
-- All studying
--
-- Batch distribution:
-- 2021 -> 13 students
-- 2022 -> 13 students
-- 2023 -> 14 students
--
-- Roll number format:
-- 21XX = joined in 2021
-- 22XX = joined in 2022
-- 23XX = joined in 2023
--
-- user_id = roll_number
-- ============================================================

INSERT INTO students
(user_id, name, classroom_id, roll_number, dob, gender,
 batch_id, blood_group, mother_tongue, is_hostel,
 photo_url, mobile_number, academic_status)
VALUES

-- ----------------------------
-- 2021 BATCH
-- ----------------------------

((SELECT id FROM users WHERE user_id = '2101'),
 'Abdul Rahman', 1, '2101', '2003-01-15', 1,
 1, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/21.jpg',
 '9100000001', 'studying'),

((SELECT id FROM users WHERE user_id = '2102'),
 'Abdullah', 2, '2102', '2003-04-22', 1,
 1, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/22.jpg',
 '9100000002', 'studying'),

((SELECT id FROM users WHERE user_id = '2103'),
 'Ahmed Ali', 3, '2103', '2003-06-18', 1,
 1, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/23.jpg',
 '9100000003', 'studying'),

((SELECT id FROM users WHERE user_id = '2104'),
 'Ammar Hassan', 4, '2104', '2003-08-11', 1,
 1, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/24.jpg',
 '9100000004', 'studying'),

((SELECT id FROM users WHERE user_id = '2105'),
 'Anas Ibrahim', 1, '2105', '2003-09-25', 1,
 1, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/25.jpg',
 '9100000005', 'studying'),

((SELECT id FROM users WHERE user_id = '2106'),
 'Arif Mohammed', 2, '2106', '2003-11-03', 1,
 1, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/26.jpg',
 '9100000006', 'studying'),

((SELECT id FROM users WHERE user_id = '2107'),
 'Bilal Ahmed', 3, '2107', '2003-12-17', 1,
 1, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/27.jpg',
 '9100000007', 'studying'),

((SELECT id FROM users WHERE user_id = '2108'),
 'Danish Rahman', 4, '2108', '2003-02-08', 1,
 1, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/28.jpg',
 '9100000008', 'studying'),

((SELECT id FROM users WHERE user_id = '2109'),
 'Ehsan Kareem', 1, '2109', '2003-03-14', 1,
 1, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/29.jpg',
 '9100000009', 'studying'),

((SELECT id FROM users WHERE user_id = '2110'),
 'Fahad Mustafa', 2, '2110', '2003-05-27', 1,
 1, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/30.jpg',
 '9100000010', 'studying'),

((SELECT id FROM users WHERE user_id = '2111'),
 'Hamza Yusuf', 3, '2111', '2003-07-09', 1,
 1, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/31.jpg',
 '9100000011', 'studying'),

((SELECT id FROM users WHERE user_id = '2112'),
 'Haris Abdullah', 4, '2112', '2003-10-20', 1,
 1, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/32.jpg',
 '9100000012', 'studying'),

((SELECT id FROM users WHERE user_id = '2113'),
 'Hasan Ibrahim', 1, '2113', '2003-12-02', 1,
 1, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/33.jpg',
 '9100000013', 'studying'),

-- ----------------------------
-- 2022 BATCH
-- ----------------------------

((SELECT id FROM users WHERE user_id = '2201'),
 'Hussain Ali', 5, '2201', '2004-01-16', 1,
 2, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/34.jpg',
 '9100000014', 'studying'),

((SELECT id FROM users WHERE user_id = '2202'),
 'Ibrahim Rahman', 6, '2202', '2004-03-21', 1,
 2, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/35.jpg',
 '9100000015', 'studying'),

((SELECT id FROM users WHERE user_id = '2203'),
 'Imran Ahmed', 7, '2203', '2004-05-11', 1,
 2, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/36.jpg',
 '9100000016', 'studying'),

((SELECT id FROM users WHERE user_id = '2204'),
 'Irfan Mohammed', 8, '2204', '2004-07-19', 1,
 2, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/37.jpg',
 '9100000017', 'studying'),

((SELECT id FROM users WHERE user_id = '2205'),
 'Ismail Hassan', 5, '2205', '2004-08-24', 1,
 2, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/38.jpg',
 '9100000018', 'studying'),

((SELECT id FROM users WHERE user_id = '2206'),
 'Junaid Kareem', 6, '2206', '2004-10-07', 1,
 2, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/39.jpg',
 '9100000019', 'studying'),

((SELECT id FROM users WHERE user_id = '2207'),
 'Khalid Rahman', 7, '2207', '2004-11-15', 1,
 2, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/40.jpg',
 '9100000020', 'studying'),

((SELECT id FROM users WHERE user_id = '2208'),
 'Mahir Ahmed', 8, '2208', '2004-12-28', 1,
 2, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/41.jpg',
 '9100000021', 'studying'),

((SELECT id FROM users WHERE user_id = '2209'),
 'Mahmood Ali', 5, '2209', '2004-02-13', 1,
 2, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/42.jpg',
 '9100000022', 'studying'),

((SELECT id FROM users WHERE user_id = '2210'),
 'Mansoor Hassan', 6, '2210', '2004-04-26', 1,
 2, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/43.jpg',
 '9100000023', 'studying'),

((SELECT id FROM users WHERE user_id = '2211'),
 'Mohammed Faisal', 7, '2211', '2004-06-09', 1,
 2, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/44.jpg',
 '9100000024', 'studying'),

((SELECT id FROM users WHERE user_id = '2212'),
 'Mubashir Ahmed', 8, '2212', '2004-09-17', 1,
 2, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/45.jpg',
 '9100000025', 'studying'),

((SELECT id FROM users WHERE user_id = '2213'),
 'Mustafa Rahman', 5, '2213', '2004-11-30', 1,
 2, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/46.jpg',
 '9100000026', 'studying'),

-- ----------------------------
-- 2023 BATCH
-- ----------------------------

((SELECT id FROM users WHERE user_id = '2301'),
 'Nabeel Ahmed', 9, '2301', '2005-01-12', 1,
 3, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/47.jpg',
 '9100000027', 'studying'),

((SELECT id FROM users WHERE user_id = '2302'),
 'Naeem Abdullah', 10, '2302', '2005-03-25', 1,
 3, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/48.jpg',
 '9100000028', 'studying'),

((SELECT id FROM users WHERE user_id = '2303'),
 'Omar Farooq', 11, '2303', '2005-05-18', 1,
 3, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/49.jpg',
 '9100000029', 'studying'),

((SELECT id FROM users WHERE user_id = '2304'),
 'Qasim Ali', 12, '2304', '2005-07-06', 1,
 3, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/50.jpg',
 '9100000030', 'studying'),

((SELECT id FROM users WHERE user_id = '2305'),
 'Rashid Hassan', 9, '2305', '2005-08-14', 1,
 3, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/51.jpg',
 '9100000031', 'studying'),

((SELECT id FROM users WHERE user_id = '2306'),
 'Saad Ibrahim', 10, '2306', '2005-09-29', 1,
 3, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/52.jpg',
 '9100000032', 'studying'),

((SELECT id FROM users WHERE user_id = '2307'),
 'Salman Ahmed', 11, '2307', '2005-11-11', 1,
 3, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/53.jpg',
 '9100000033', 'studying'),

((SELECT id FROM users WHERE user_id = '2308'),
 'Sami Rahman', 12, '2308', '2005-12-22', 1,
 3, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/54.jpg',
 '9100000034', 'studying'),

((SELECT id FROM users WHERE user_id = '2309'),
 'Shakir Mohammed', 9, '2309', '2005-02-17', 1,
 3, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/55.jpg',
 '9100000035', 'studying'),

((SELECT id FROM users WHERE user_id = '2310'),
 'Sulaiman Kareem', 10, '2310', '2005-04-08', 1,
 3, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/56.jpg',
 '9100000036', 'studying'),

((SELECT id FROM users WHERE user_id = '2311'),
 'Yusuf Abdullah', 11, '2311', '2005-06-19', 1,
 3, 1, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/57.jpg',
 '9100000037', 'studying'),

((SELECT id FROM users WHERE user_id = '2312'),
 'Zaid Ahmed', 12, '2312', '2005-08-27', 1,
 3, 2, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/58.jpg',
 '9100000038', 'studying'),

((SELECT id FROM users WHERE user_id = '2313'),
 'Afnan Rahman', 9, '2313', '2005-10-13', 1,
 3, 3, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/59.jpg',
 '9100000039', 'studying'),

((SELECT id FROM users WHERE user_id = '2314'),
 'Faizan Hassan', 10, '2314', '2005-12-05', 1,
 3, 4, 'Malayalam', 1,
 'https://randomuser.me/api/portraits/men/60.jpg',
 '9100000040', 'studying');


-- ============================================================
-- 10. STUDENT OTHER DETAILS
-- ============================================================
-- religion_id = 1 for every student
-- ============================================================

INSERT INTO student_other_details
(student_id, religion_id, caste_id, social_category_id,
 madhab_id, is_orphan, aadhar_no, medical_remarks, notes)
SELECT
    s.id,
    1,
    NULL,
    NULL,
    NULL,
    0,
    CONCAT('80000000', LPAD(s.id, 4, '0')),
    NULL,
    'Seed data'
FROM students s
ORDER BY s.id;


-- ============================================================
-- 11. STUDENT ACADEMIC DETAILS
-- ============================================================

INSERT INTO student_academic_details
(student_id, rrn, univ_email, yoj, yoc,
 madras_course, madras_roll_no, madras_joining_year)
SELECT
    s.id,
    CONCAT('RRN', s.roll_number),
    CONCAT(s.roll_number, '@university.edu'),
    CASE s.batch_id
        WHEN 1 THEN 2021
        WHEN 2 THEN 2022
        WHEN 3 THEN 2023
    END,
    CASE s.batch_id
        WHEN 1 THEN 2026
        WHEN 2 THEN 2027
        WHEN 3 THEN 2024
    END,
    'Islamic Studies',
    CONCAT('MR', s.roll_number),
    CASE s.batch_id
        WHEN 1 THEN 2021
        WHEN 2 THEN 2022
        WHEN 3 THEN 2023
    END
FROM students s
ORDER BY s.id;


-- ============================================================
-- 12. STUDENT FAMILY DETAILS
-- ============================================================

INSERT INTO student_family_details
(
    student_id,
    father_name,
    father_mobile,
    father_education,
    father_occupation,
    father_annual_income,
    mother_name,
    mother_mobile,
    mother_education,
    mother_occupation,
    mother_annual_income,
    parent_email,
    parent_whatsapp,
    parent_sms,
    guardian_name,
    guardian_mobile,
    guardian_relationship,
    guardian_address
)
SELECT
    s.id,
    CONCAT('Father of ', s.name),
    CONCAT('920000', LPAD(s.id, 5, '0')),
    'Graduate',
    'Business',
    500000,
    CONCAT('Mother of ', s.name),
    CONCAT('930000', LPAD(s.id, 5, '0')),
    'Graduate',
    'Homemaker',
    0,
    CONCAT(s.roll_number, '.parent@example.com'),
    CONCAT('920000', LPAD(s.id, 5, '0')),
    CONCAT('920000', LPAD(s.id, 5, '0')),
    CONCAT('Guardian of ', s.name),
    CONCAT('940000', LPAD(s.id, 5, '0')),
    'Uncle',
    'Chennai, Tamil Nadu, India'
FROM students s
ORDER BY s.id;


-- ============================================================
-- 13. STUDENT ADDRESSES
-- ============================================================
-- address_type:
-- 0 = Present Address
-- 1 = Permanent Address
--
-- Every student receives both.
-- ============================================================

INSERT INTO student_addresses
(student_id, address_type, door_no, street, area, city,
 district, state, country, pin_code)
SELECT
    id,
    0,
    CONCAT(id, '-A'),
    'College Road',
    'Islamic Nagar',
    'Chennai',
    'Chennai',
    'Tamil Nadu',
    'India',
    '600001'
FROM students;

INSERT INTO student_addresses
(student_id, address_type, door_no, street, area, city,
 district, state, country, pin_code)
SELECT
    id,
    1,
    CONCAT(id, '-B'),
    'Main Road',
    'Muslim Nagar',
    'Chennai',
    'Chennai',
    'Tamil Nadu',
    'India',
    '600002'
FROM students;


-- ============================================================
-- 14. STUDENT QUALIFICATIONS
-- ============================================================
-- Exactly 3 qualifications for every student:
-- 10th
-- 11th
-- 12th
-- ============================================================

INSERT INTO student_qualifications
(
    student_id,
    level,
    school_name,
    board,
    medium,
    passing_year,
    passing_month,
    school_address,
    reg_number,
    marks,
    total_marks,
    emis
)
SELECT
    id,
    '10th',
    'Al Huda Higher Secondary School',
    'State Board',
    'English',
    CASE batch_id
        WHEN 1 THEN 2019
        WHEN 2 THEN 2020
        WHEN 3 THEN 2021
    END,
    'March',
    'Chennai, Tamil Nadu, India',
    CONCAT('10', roll_number),
    420.00,
    500.00,
    CONCAT('EMIS10', roll_number)
FROM students

UNION ALL

SELECT
    id,
    '11th',
    'Al Huda Higher Secondary School',
    'State Board',
    'English',
    CASE batch_id
        WHEN 1 THEN 2020
        WHEN 2 THEN 2021
        WHEN 3 THEN 2022
    END,
    'March',
    'Chennai, Tamil Nadu, India',
    CONCAT('11', roll_number),
    440.00,
    500.00,
    CONCAT('EMIS11', roll_number)
FROM students

UNION ALL

SELECT
    id,
    '12th',
    'Al Huda Higher Secondary School',
    'State Board',
    'English',
    CASE batch_id
        WHEN 1 THEN 2021
        WHEN 2 THEN 2022
        WHEN 3 THEN 2023
    END,
    'March',
    'Chennai, Tamil Nadu, India',
    CONCAT('12', roll_number),
    455.00,
    500.00,
    CONCAT('EMIS12', roll_number);


-- ============================================================
-- 15. STUDENT EXTRA QUALIFICATIONS
-- ============================================================
-- One additional qualification for each student.
-- ============================================================

INSERT INTO student_extra_qualifications
(student_id, course_name, cert_url)
SELECT
    id,
    'Certificate in Quran Recitation',
    CONCAT('https://example.com/certificates/', roll_number, '.pdf')
FROM students;


-- ============================================================
-- 16. STUDENT ADMISSION DETAILS
-- ============================================================

INSERT INTO student_admission_details
(student_id, admission_date, entrance_mark, entrance_rank,
 hafiz, recommended_by)
SELECT
    id,
    CASE batch_id
        WHEN 1 THEN '2021-06-10'
        WHEN 2 THEN '2022-06-10'
        WHEN 3 THEN '2023-06-10'
    END,
    82.50,
    id,
    0,
    'College Admission Committee'
FROM students;


-- ============================================================
-- 17. STUDENT RELATED LINKS
-- ============================================================
-- One sample link per student.
-- ============================================================

INSERT INTO student_related_links
(student_id, description, url)
SELECT
    id,
    'Student Profile',
    CONCAT('https://example.com/students/', roll_number)
FROM students;


-- ============================================================
-- SEED DATA COMPLETE
-- ============================================================