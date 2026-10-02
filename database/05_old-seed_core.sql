-- database/seed.sql

-- ============================================================
-- COLLEGE ERP - SEED DATA
-- ============================================================
-- Assumes the updated schema.sql has already been executed.
--
-- Seed order:
-- 1.  courses
-- 2.  batches
-- 3.  semesters
-- 4.  academic_years
-- 5.  academic_terms
-- 6.  users
-- 7.  staff
-- 8.  staff_employment_details
-- 9.  staff_qualifications
-- 10. staff_addresses
-- 11. staff_other_details
-- 12. classrooms
-- 13. subjects
-- 14. students
-- 15. student_other_details
-- 16. student_academic_details
-- 17. student_family_details
-- 18. student_addresses
-- 19. student_qualifications
-- 20. student_extra_qualifications
-- 21. student_admission_details
-- 22. student_related_links
-- 23. student_academic_enrollments
--
-- Conventions used in this file:
-- address_type : 1 = Permanent, 2 = Present
-- gender       : 1 = Male, 2 = Female
-- religion_id  : 1 = Muslim
-- Passwords are bcrypt hashes.
-- ============================================================

-- ============================================================
-- 1. COURSES
-- ============================================================

INSERT INTO courses
(name, is_default, is_active)
VALUES
('KBA', TRUE, TRUE),
('Diploma', FALSE, TRUE);

-- ============================================================
-- 2. BATCHES
-- ============================================================

INSERT INTO batches
(course_id, batch_name, start_year, end_year)
VALUES
((SELECT id FROM courses WHERE name = 'KBA'), '2022 - 2023', 2022, 2023),
((SELECT id FROM courses WHERE name = 'KBA'), '2023 - 2024', 2023, 2024),
((SELECT id FROM courses WHERE name = 'KBA'), '2024 - 2025', 2024, 2025);

-- ============================================================
-- 3. SEMESTERS
-- ============================================================
-- Sem 1 to Sem 6 for each course.
-- ============================================================

INSERT INTO semesters
(course_id, name, is_active)
VALUES
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 1', TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 2', TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 3', TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 4', TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 5', TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), 'Sem 6', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 1', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 2', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 3', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 4', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 5', TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), 'Sem 6', TRUE);

-- ============================================================
-- 4. ACADEMIC YEARS
-- ============================================================

INSERT INTO academic_years
(name, start_date, end_date, is_current)
VALUES
('2022-2023', '2022-06-01', '2023-04-30', FALSE),
('2023-2024', '2023-06-01', '2024-04-30', FALSE),
('2024-2025', '2024-06-01', '2025-04-30', TRUE);

-- ============================================================
-- 5. ACADEMIC TERMS
-- ============================================================
-- Odd + Even term for every academic year, for each course.
-- The 2024-2025 Odd Term is marked as the current term.
-- ============================================================

INSERT INTO academic_terms
(course_id, name, term_type, start_date, end_date, is_current, is_active)
VALUES
((SELECT id FROM courses WHERE name = 'KBA'), '2022-2023 Odd Term', 'ODD', '2022-06-01', '2022-11-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), '2022-2023 Even Term', 'EVEN', '2022-12-01', '2023-04-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), '2023-2024 Odd Term', 'ODD', '2023-06-01', '2023-11-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), '2023-2024 Even Term', 'EVEN', '2023-12-01', '2024-04-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), '2024-2025 Odd Term', 'ODD', '2024-06-01', '2024-11-30', TRUE, TRUE),
((SELECT id FROM courses WHERE name = 'KBA'), '2024-2025 Even Term', 'EVEN', '2024-12-01', '2025-04-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2022-2023 Odd Term', 'ODD', '2022-06-01', '2022-11-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2022-2023 Even Term', 'EVEN', '2022-12-01', '2023-04-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2023-2024 Odd Term', 'ODD', '2023-06-01', '2023-11-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2023-2024 Even Term', 'EVEN', '2023-12-01', '2024-04-30', FALSE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2024-2025 Odd Term', 'ODD', '2024-06-01', '2024-11-30', TRUE, TRUE),
((SELECT id FROM courses WHERE name = 'Diploma'), '2024-2025 Even Term', 'EVEN', '2024-12-01', '2025-04-30', FALSE, TRUE);

-- ============================================================
-- 6. USERS
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
-- STAFF USERS (12 male, 3 female)
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
-- STUDENT USERS (10 per batch)
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
('2401', '2401@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2402', '2402@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2403', '2403@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2404', '2404@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2405', '2405@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2406', '2406@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2407', '2407@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2408', '2408@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2409', '2409@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi'),
('2410', '2410@student.edu', 'student', 'active', '$2b$10$cFjbprv5OhyIkUZu/ECNG.5aPN1w2j1t8zyzisHU8rMVoiew5CkLi');

-- ============================================================
-- 7. STAFF
-- ============================================================
-- 15 staff, all Muslim (religion_id = 1)
-- 12 male (kba001 - kba012) and 3 female (kba013 - kba015)
-- salutation: 1 = Mr, 3 = Ms, 4 = Dr
-- marital_status: 1 = Single, 2 = Married
-- Photos: RandomUser public portraits (valid URLs for testing)
-- ============================================================

INSERT INTO staff
(user_id, staff_uid, name, short_name, salutation, gender,
 dob, blood_group, mobile_number, emergency_contact,
 personal_email, religion_id, marital_status, medical_remarks,
 photo_url, date_of_joining)
VALUES

(
    (SELECT id FROM users WHERE user_id = 'kba001'),
    'kba001', 'Abdul Kareem', 'A. Kareem', 1, 1,
    '1982-03-15', 2, '9000000001', '9000001001',
    'abdulkareem@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/1.jpg', '2011-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba002'),
    'kba002', 'Muhammad Salman', 'M. Salman', 1, 1,
    '1985-07-22', 3, '9000000002', '9000001002',
    'muhammadsalman@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/2.jpg', '2012-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba003'),
    'kba003', 'Abdullah Farooq', 'A. Farooq', 4, 1,
    '1979-11-10', 4, '9000000003', '9000001003',
    'abdullahfarooq@college.edu', 1, 1, NULL,
    'https://randomuser.me/api/portraits/men/3.jpg', '2013-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba004'),
    'kba004', 'Ibrahim Hassan', 'I. Hassan', 1, 1,
    '1988-01-25', 5, '9000000004', '9000001004',
    'ibrahimhassan@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/4.jpg', '2014-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba005'),
    'kba005', 'Yusuf Ahmed', 'Y. Ahmed', 1, 1,
    '1981-05-18', 6, '9000000005', '9000001005',
    'yusufahmed@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/5.jpg', '2015-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba006'),
    'kba006', 'Omar Abdullah', 'O. Abdullah', 1, 1,
    '1987-09-03', 7, '9000000006', '9000001006',
    'omarabdullah@college.edu', 1, 1, NULL,
    'https://randomuser.me/api/portraits/men/6.jpg', '2016-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba007'),
    'kba007', 'Hamza Rahman', 'H. Rahman', 1, 1,
    '1990-12-11', 8, '9000000007', '9000001007',
    'hamzarahman@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/7.jpg', '2017-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba008'),
    'kba008', 'Bilal Mahmood', 'B. Mahmood', 1, 1,
    '1984-02-28', 1, '9000000008', '9000001008',
    'bilalmahmood@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/8.jpg', '2018-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba009'),
    'kba009', 'Ammar Siddiq', 'A. Siddiq', 1, 1,
    '1986-08-19', 2, '9000000009', '9000001009',
    'ammarsiddiq@college.edu', 1, 1, NULL,
    'https://randomuser.me/api/portraits/men/9.jpg', '2010-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba010'),
    'kba010', 'Fahad Nazeer', 'F. Nazeer', 1, 1,
    '1991-04-07', 3, '9000000010', '9000001010',
    'fahadnazeer@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/10.jpg', '2011-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba011'),
    'kba011', 'Saifullah Khan', 'S. Khan', 1, 1,
    '1989-06-23', 4, '9000000011', '9000001011',
    'saifullahkhan@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/men/11.jpg', '2012-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba012'),
    'kba012', 'Zaid Ibrahim', 'Z. Ibrahim', 4, 1,
    '1983-10-14', 5, '9000000012', '9000001012',
    'zaidibrahim@college.edu', 1, 1, NULL,
    'https://randomuser.me/api/portraits/men/12.jpg', '2013-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba013'),
    'kba013', 'Ayesha Rahman', 'A. Rahman', 3, 2,
    '1987-03-12', 6, '9000000013', '9000001013',
    'ayesharahman@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/women/1.jpg', '2014-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba014'),
    'kba014', 'Maryam Hassan', 'M. Hassan', 3, 2,
    '1990-09-27', 7, '9000000014', '9000001014',
    'maryamhassan@college.edu', 1, 2, NULL,
    'https://randomuser.me/api/portraits/women/2.jpg', '2015-06-01'
),

(
    (SELECT id FROM users WHERE user_id = 'kba015'),
    'kba015', 'Fatima Zahra', 'F. Zahra', 3, 2,
    '1992-01-19', 8, '9000000015', '9000001015',
    'fatimazahra@college.edu', 1, 1, NULL,
    'https://randomuser.me/api/portraits/women/3.jpg', '2016-06-01'
);

-- ============================================================
-- 8. STAFF EMPLOYMENT DETAILS
-- ============================================================
-- staff_type, designation, employment_nature, employment_place and
-- university_designation are placeholder numeric IDs.
-- ============================================================

INSERT INTO staff_employment_details
(staff_id, staff_type, designation, experience_years,
 employment_nature, employment_place, university_id,
 university_designation, university_experience, work_email, notes)
VALUES
((SELECT id FROM staff WHERE staff_uid = 'kba001'), 1, 2, 12.0, 1, 1, NULL, 2, 5.0, 'kba001@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba002'), 1, 3, 10.0, 1, 1, NULL, 3, 5.0, 'kba002@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba003'), 1, 4, 15.0, 1, 1, NULL, 4, 5.0, 'kba003@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba004'), 1, 1, 8.0, 1, 1, NULL, 1, 5.0, 'kba004@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba005'), 1, 2, 11.0, 1, 1, NULL, 2, 5.0, 'kba005@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba006'), 1, 3, 9.0, 1, 1, NULL, 3, 5.0, 'kba006@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba007'), 1, 4, 7.0, 1, 1, NULL, 4, 5.0, 'kba007@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba008'), 1, 1, 10.0, 1, 1, NULL, 1, 5.0, 'kba008@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba009'), 1, 2, 8.0, 1, 1, NULL, 2, 5.0, 'kba009@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba010'), 1, 3, 6.0, 1, 1, NULL, 3, 5.0, 'kba010@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba011'), 1, 4, 9.0, 1, 1, NULL, 4, 5.0, 'kba011@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba012'), 1, 1, 12.0, 1, 1, NULL, 1, 5.0, 'kba012@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba013'), 1, 2, 8.0, 1, 1, NULL, 2, 5.0, 'kba013@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba014'), 1, 3, 6.0, 1, 1, NULL, 3, 5.0, 'kba014@college.edu', 'Seed data'),
((SELECT id FROM staff WHERE staff_uid = 'kba015'), 1, 4, 5.0, 1, 1, NULL, 4, 5.0, 'kba015@college.edu', 'Seed data');

-- ============================================================
-- 9. STAFF QUALIFICATIONS
-- ============================================================

INSERT INTO staff_qualifications
(staff_id, qualifications)
VALUES
((SELECT id FROM staff WHERE staff_uid = 'kba001'), 'MA Islamic Studies, MPhil'),
((SELECT id FROM staff WHERE staff_uid = 'kba002'), 'MA Arabic, B.Ed'),
((SELECT id FROM staff WHERE staff_uid = 'kba003'), 'MA Islamic Studies, PhD'),
((SELECT id FROM staff WHERE staff_uid = 'kba004'), 'MA Quranic Studies'),
((SELECT id FROM staff WHERE staff_uid = 'kba005'), 'MA Hadith Studies, MPhil'),
((SELECT id FROM staff WHERE staff_uid = 'kba006'), 'MA Arabic Literature'),
((SELECT id FROM staff WHERE staff_uid = 'kba007'), 'MA Islamic Jurisprudence'),
((SELECT id FROM staff WHERE staff_uid = 'kba008'), 'MA Quranic Sciences, MPhil'),
((SELECT id FROM staff WHERE staff_uid = 'kba009'), 'MA Islamic Studies'),
((SELECT id FROM staff WHERE staff_uid = 'kba010'), 'MA Arabic'),
((SELECT id FROM staff WHERE staff_uid = 'kba011'), 'MA Islamic History'),
((SELECT id FROM staff WHERE staff_uid = 'kba012'), 'MA Hadith Studies, PhD'),
((SELECT id FROM staff WHERE staff_uid = 'kba013'), 'MA Islamic Studies, B.Ed'),
((SELECT id FROM staff WHERE staff_uid = 'kba014'), 'MA Arabic, MPhil'),
((SELECT id FROM staff WHERE staff_uid = 'kba015'), 'MA Islamic Jurisprudence');

-- ============================================================
-- 10. STAFF ADDRESSES
-- ============================================================
-- address_type: 1 = Permanent, 2 = Present
-- Every staff member receives both addresses.
-- ============================================================

INSERT INTO staff_addresses
(staff_id, address_type, door_no, street, area, city,
 district, state, pin_code, country)
SELECT
    id, 1, CONCAT(id, '-B'), 'Main Road', 'Muslim Nagar',
    'Chennai', 'Chennai', 'Tamil Nadu', '600002', 'India'
FROM staff;

INSERT INTO staff_addresses
(staff_id, address_type, door_no, street, area, city,
 district, state, pin_code, country)
SELECT
    id, 2, CONCAT(id, '-A'), 'College Road', 'Islamic Nagar',
    'Chennai', 'Chennai', 'Tamil Nadu', '600001', 'India'
FROM staff;

-- ============================================================
-- 11. STAFF OTHER DETAILS
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
-- 12. CLASSROOMS
-- ============================================================
-- semester -> 1 to 12
-- course   -> courses.id (KBA)
--
-- 1st Year A/B -> Sem 1   (2024 - 2025 batch)
-- 2nd Year A/B -> Sem 3   (2023 - 2024 batch)
-- 3rd Year     -> Sem 5   (2022 - 2023 batch)
-- 4th Year     -> Sem 1   (no batch assigned yet)
-- 5th Year     -> Sem 3   (no batch assigned yet)
-- ============================================================

INSERT INTO classrooms
(name, room_no, semester, advisor_id, leader_id, batch_id, course, is_active)
VALUES
('1st Year A Sec', '101', 1, (SELECT id FROM staff WHERE staff_uid = 'kba001'), NULL, (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), (SELECT id FROM courses WHERE name = 'KBA'), 1),
('1st Year B Sec', '102', 1, (SELECT id FROM staff WHERE staff_uid = 'kba002'), NULL, (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), (SELECT id FROM courses WHERE name = 'KBA'), 1),
('2nd Year A Sec', '201', 3, (SELECT id FROM staff WHERE staff_uid = 'kba003'), NULL, (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), (SELECT id FROM courses WHERE name = 'KBA'), 1),
('2nd Year B Sec', '202', 3, (SELECT id FROM staff WHERE staff_uid = 'kba004'), NULL, (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), (SELECT id FROM courses WHERE name = 'KBA'), 1),
('3rd Year',       '301', 5, (SELECT id FROM staff WHERE staff_uid = 'kba005'), NULL, (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), (SELECT id FROM courses WHERE name = 'KBA'), 1),
('4th Year',       '401', 1, (SELECT id FROM staff WHERE staff_uid = 'kba006'), NULL, NULL, (SELECT id FROM courses WHERE name = 'KBA'), 1),
('5th Year',       '501', 3, (SELECT id FROM staff WHERE staff_uid = 'kba007'), NULL, NULL, (SELECT id FROM courses WHERE name = 'KBA'), 1);

-- ============================================================
-- 13. SUBJECTS
-- ============================================================
-- 5 Islamic-studies subjects per classroom (35 in total).
-- course -> courses.id, semester -> 1 to 12, term -> 1 or 2
-- (same values as the classroom the subject belongs to).
-- handling_staff_id is spread across the 15 staff members.
-- ============================================================

INSERT INTO subjects
(code, name, short_name, display_name, book_name, description,
 course, semester, term, credits, univ_credits, classroom_id,
 course_staff_id, handling_staff_id, is_active)
VALUES

-- 1st Year A Sec
('QRT-1A', 'Quran Recitation and Tajweed', 'QRT', 'Tajweed', 'Tajweed Basics', 'Rules of tajweed and correct Quran recitation', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba001'), 1),
('NHW-1A', 'Arabic Grammar (Nahw)', 'NHW', 'Al-Nahw', 'Al-Nahw Al-Wadih', 'Introduction to Arabic grammar', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba002'), 1),
('AQD-1A', 'Islamic Creed (Aqeedah)', 'AQD', 'Aqeedah', 'Aqeedah al-Tahawiyyah', 'Foundational Islamic beliefs and creed', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba003'), 1),
('FQB-1A', 'Fiqh of Worship (Ibadat)', 'FQB', 'Fiqh Basics', 'Al-Fiqh al-Muyassar', 'Basic rulings of purification, prayer, fasting', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba004'), 1),
('SRH-1A', 'Seerah of the Prophet', 'SRH', 'Seerah', 'Al-Raheeq Al-Makhtum', 'Life and biography of Prophet Muhammad (PBUH)', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba005'), 1),

-- 1st Year B Sec
('QRT-1B', 'Quran Recitation and Tajweed', 'QRT', 'Tajweed', 'Tajweed Basics', 'Rules of tajweed and correct Quran recitation', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba006'), 1),
('NHW-1B', 'Arabic Grammar (Nahw)', 'NHW', 'Al-Nahw', 'Al-Nahw Al-Wadih', 'Introduction to Arabic grammar', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba007'), 1),
('AQD-1B', 'Islamic Creed (Aqeedah)', 'AQD', 'Aqeedah', 'Aqeedah al-Tahawiyyah', 'Foundational Islamic beliefs and creed', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba008'), 1),
('FQB-1B', 'Fiqh of Worship (Ibadat)', 'FQB', 'Fiqh Basics', 'Al-Fiqh al-Muyassar', 'Basic rulings of purification, prayer, fasting', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba009'), 1),
('SRH-1B', 'Seerah of the Prophet', 'SRH', 'Seerah', 'Al-Raheeq Al-Makhtum', 'Life and biography of Prophet Muhammad (PBUH)', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba010'), 1),

-- 2nd Year A Sec
('HD1-2A', 'Hadith Studies I', 'HD1', 'Hadith I', 'Riyadh al-Saliheen', 'Study of selected Prophetic traditions', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba011'), 1),
('SRF-2A', 'Arabic Morphology (Sarf)', 'SRF', 'Al-Sarf', 'Al-Tasrif al-Izzi', 'Arabic word formation and conjugation', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba012'), 1),
('TFS-2A', 'Introduction to Tafsir', 'TFS', 'Tafsir I', 'Tafsir al-Jalalayn', 'Introduction to Quranic exegesis', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba013'), 1),
('FQM-2A', 'Fiqh of Transactions (Muamalat)', 'FQM', 'Muamalat', 'Al-Fiqh al-Manhaji', 'Islamic rulings on trade and contracts', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba014'), 1),
('IHS-2A', 'Islamic History', 'IHS', 'Tarikh', 'Tarikh al-Islam', 'History of the rightly guided caliphs and early Islam', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba015'), 1),

-- 2nd Year B Sec
('HD1-2B', 'Hadith Studies I', 'HD1', 'Hadith I', 'Riyadh al-Saliheen', 'Study of selected Prophetic traditions', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba001'), 1),
('SRF-2B', 'Arabic Morphology (Sarf)', 'SRF', 'Al-Sarf', 'Al-Tasrif al-Izzi', 'Arabic word formation and conjugation', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba002'), 1),
('TFS-2B', 'Introduction to Tafsir', 'TFS', 'Tafsir I', 'Tafsir al-Jalalayn', 'Introduction to Quranic exegesis', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba003'), 1),
('FQM-2B', 'Fiqh of Transactions (Muamalat)', 'FQM', 'Muamalat', 'Al-Fiqh al-Manhaji', 'Islamic rulings on trade and contracts', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba004'), 1),
('IHS-2B', 'Islamic History', 'IHS', 'Tarikh', 'Tarikh al-Islam', 'History of the rightly guided caliphs and early Islam', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba005'), 1),

-- 3rd Year
('UFQ-3', 'Usul al-Fiqh', 'UFQ', 'Usul Fiqh', 'Al-Waraqat', 'Principles of Islamic legal reasoning', (SELECT id FROM courses WHERE name = 'KBA'), 5, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '3rd Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba006'), 1),
('UHD-3', 'Sciences of Hadith', 'UHD', 'Ulum Hadith', 'Nuzhat al-Nazar', 'Classification and authentication of Hadith', (SELECT id FROM courses WHERE name = 'KBA'), 5, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '3rd Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba007'), 1),
('TF2-3', 'Tafsir Advanced', 'TF2', 'Tafsir II', 'Tafsir Ibn Kathir', 'Advanced Quranic exegesis', (SELECT id FROM courses WHERE name = 'KBA'), 5, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '3rd Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba008'), 1),
('ADB-3', 'Arabic Literature', 'ADB', 'Al-Adab', 'Maqamat al-Hariri', 'Classical Arabic literature and poetry', (SELECT id FROM courses WHERE name = 'KBA'), 5, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '3rd Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba009'), 1),
('AKH-3', 'Islamic Ethics (Akhlaq)', 'AKH', 'Akhlaq', 'Riyadh al-Saliheen (Akhlaq)', 'Islamic character building and spirituality', (SELECT id FROM courses WHERE name = 'KBA'), 5, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '3rd Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba010'), 1),

-- 4th Year
('CFQ-4', 'Comparative Fiqh', 'CFQ', 'Fiqh Muqaran', 'Bidayat al-Mujtahid', 'Comparative study of the schools of law', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '4th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba011'), 1),
('BLG-4', 'Arabic Rhetoric (Balagha)', 'BLG', 'Balagha', 'Jawahir al-Balagha', 'Arabic rhetoric and eloquence', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '4th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba012'), 1),
('UTF-4', 'Principles of Tafsir', 'UTF', 'Usul Tafsir', 'Al-Fawz al-Kabir', 'Methodology of Quranic interpretation', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '4th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba013'), 1),
('IEC-4', 'Islamic Economics', 'IEC', 'Iqtisad', 'Islamic Economics Primer', 'Principles of Islamic finance and economics', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '4th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba014'), 1),
('DAW-4', 'Dawah and Communication', 'DAW', 'Dawah', 'Fiqh al-Dawah', 'Islamic outreach and communication skills', (SELECT id FROM courses WHERE name = 'KBA'), (SELECT id FROM semesters WHERE course_id = (SELECT id FROM courses WHERE name = 'KBA') AND name = 'Sem 1'), 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '4th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba015'), 1),

-- 5th Year
('AHD-5', 'Advanced Hadith Studies', 'AHD', 'Hadith II', 'Sahih al-Bukhari (Selections)', 'Advanced study of Prophetic traditions', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '5th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba001'), 1),
('FRS-5', 'Fiqh Research Methodology', 'FRS', 'Bahth Fiqh', 'Manahij al-Bahth al-Fiqhi', 'Research methods in Islamic jurisprudence', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '5th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba002'), 1),
('KLM-5', 'Islamic Theology (Ilm al-Kalam)', 'KLM', 'Kalam', 'Sharh al-Aqaid al-Nasafiyyah', 'Classical Islamic theology and philosophy', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 3.0, 3.0, (SELECT id FROM classrooms WHERE name = '5th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba003'), 1),
('CIS-5', 'Contemporary Islamic Issues', 'CIS', 'Nawazil', 'Fiqh al-Nawazil', 'Modern issues in the light of Islamic law', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '5th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba004'), 1),
('RSM-5', 'Research Methodology', 'RSM', 'Research', 'Research Methods in Islamic Studies', 'Academic research and thesis writing', (SELECT id FROM courses WHERE name = 'KBA'), 3, 1, 2.0, 2.0, (SELECT id FROM classrooms WHERE name = '5th Year'), NULL, (SELECT id FROM staff WHERE staff_uid = 'kba005'), 1);

-- ============================================================
-- 14. STUDENTS
-- ============================================================
-- 30 students (10 per batch), all male, all Muslim,
-- all hostel students, all studying.
--
-- Roll number format:
-- 22XX = 2022 - 2023 batch  -> 3rd Year
-- 23XX = 2023 - 2024 batch  -> 2nd Year A (01-05) / B (06-10)
-- 24XX = 2024 - 2025 batch  -> 1st Year A (01-05) / B (06-10)
--
-- user_id = roll_number
-- Photos: RandomUser public portraits (valid URLs for testing)
-- ============================================================

INSERT INTO students
(user_id, name, classroom_id, roll_number, dob, gender,
 batch_id, blood_group, mother_tongue, is_hostel,
 photo_url, mobile_number, academic_status)
VALUES

((SELECT id FROM users WHERE user_id = '2201'),
 'Abdul Rahman', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2201', '2004-02-03', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 2, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/21.jpg',
 '9100000001', 'studying'),

((SELECT id FROM users WHERE user_id = '2202'),
 'Ahmed Ali', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2202', '2004-03-05', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 3, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/22.jpg',
 '9100000002', 'studying'),

((SELECT id FROM users WHERE user_id = '2203'),
 'Ammar Hassan', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2203', '2004-04-07', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 4, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/23.jpg',
 '9100000003', 'studying'),

((SELECT id FROM users WHERE user_id = '2204'),
 'Anas Ibrahim', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2204', '2004-05-09', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 5, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/24.jpg',
 '9100000004', 'studying'),

((SELECT id FROM users WHERE user_id = '2205'),
 'Arif Mohammed', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2205', '2004-06-11', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 6, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/25.jpg',
 '9100000005', 'studying'),

((SELECT id FROM users WHERE user_id = '2206'),
 'Bilal Ahmed', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2206', '2004-07-13', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 7, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/26.jpg',
 '9100000006', 'studying'),

((SELECT id FROM users WHERE user_id = '2207'),
 'Danish Rahman', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2207', '2004-08-15', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 8, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/27.jpg',
 '9100000007', 'studying'),

((SELECT id FROM users WHERE user_id = '2208'),
 'Ehsan Kareem', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2208', '2004-09-17', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 1, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/28.jpg',
 '9100000008', 'studying'),

((SELECT id FROM users WHERE user_id = '2209'),
 'Fahad Mustafa', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2209', '2004-10-19', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 2, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/29.jpg',
 '9100000009', 'studying'),

((SELECT id FROM users WHERE user_id = '2210'),
 'Hamza Yusuf', (SELECT id FROM classrooms WHERE name = '3rd Year'), '2210', '2004-11-21', 1,
 (SELECT id FROM batches WHERE batch_name = '2022 - 2023'), 3, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/30.jpg',
 '9100000010', 'studying'),

((SELECT id FROM users WHERE user_id = '2301'),
 'Haris Abdullah', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), '2301', '2005-02-03', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 4, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/31.jpg',
 '9100000011', 'studying'),

((SELECT id FROM users WHERE user_id = '2302'),
 'Hasan Ibrahim', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), '2302', '2005-03-05', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 5, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/32.jpg',
 '9100000012', 'studying'),

((SELECT id FROM users WHERE user_id = '2303'),
 'Hussain Ali', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), '2303', '2005-04-07', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 6, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/33.jpg',
 '9100000013', 'studying'),

((SELECT id FROM users WHERE user_id = '2304'),
 'Ibrahim Rahman', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), '2304', '2005-05-09', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 7, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/34.jpg',
 '9100000014', 'studying'),

((SELECT id FROM users WHERE user_id = '2305'),
 'Imran Ahmed', (SELECT id FROM classrooms WHERE name = '2nd Year A Sec'), '2305', '2005-06-11', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 8, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/35.jpg',
 '9100000015', 'studying'),

((SELECT id FROM users WHERE user_id = '2306'),
 'Irfan Mohammed', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), '2306', '2005-07-13', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 1, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/36.jpg',
 '9100000016', 'studying'),

((SELECT id FROM users WHERE user_id = '2307'),
 'Ismail Hassan', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), '2307', '2005-08-15', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 2, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/37.jpg',
 '9100000017', 'studying'),

((SELECT id FROM users WHERE user_id = '2308'),
 'Junaid Kareem', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), '2308', '2005-09-17', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 3, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/38.jpg',
 '9100000018', 'studying'),

((SELECT id FROM users WHERE user_id = '2309'),
 'Khalid Rahman', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), '2309', '2005-10-19', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 4, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/39.jpg',
 '9100000019', 'studying'),

((SELECT id FROM users WHERE user_id = '2310'),
 'Mahir Ahmed', (SELECT id FROM classrooms WHERE name = '2nd Year B Sec'), '2310', '2005-11-21', 1,
 (SELECT id FROM batches WHERE batch_name = '2023 - 2024'), 5, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/40.jpg',
 '9100000020', 'studying'),

((SELECT id FROM users WHERE user_id = '2401'),
 'Mahmood Ali', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), '2401', '2006-02-03', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 6, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/41.jpg',
 '9100000021', 'studying'),

((SELECT id FROM users WHERE user_id = '2402'),
 'Mansoor Hassan', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), '2402', '2006-03-05', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 7, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/42.jpg',
 '9100000022', 'studying'),

((SELECT id FROM users WHERE user_id = '2403'),
 'Mohammed Faisal', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), '2403', '2006-04-07', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 8, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/43.jpg',
 '9100000023', 'studying'),

((SELECT id FROM users WHERE user_id = '2404'),
 'Mubashir Ahmed', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), '2404', '2006-05-09', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 1, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/44.jpg',
 '9100000024', 'studying'),

((SELECT id FROM users WHERE user_id = '2405'),
 'Mustafa Rahman', (SELECT id FROM classrooms WHERE name = '1st Year A Sec'), '2405', '2006-06-11', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 2, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/45.jpg',
 '9100000025', 'studying'),

((SELECT id FROM users WHERE user_id = '2406'),
 'Nabeel Ahmed', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), '2406', '2006-07-13', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 3, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/46.jpg',
 '9100000026', 'studying'),

((SELECT id FROM users WHERE user_id = '2407'),
 'Naeem Abdullah', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), '2407', '2006-08-15', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 4, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/47.jpg',
 '9100000027', 'studying'),

((SELECT id FROM users WHERE user_id = '2408'),
 'Omar Farooq', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), '2408', '2006-09-17', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 5, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/48.jpg',
 '9100000028', 'studying'),

((SELECT id FROM users WHERE user_id = '2409'),
 'Qasim Ali', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), '2409', '2006-10-19', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 6, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/49.jpg',
 '9100000029', 'studying'),

((SELECT id FROM users WHERE user_id = '2410'),
 'Rashid Hassan', (SELECT id FROM classrooms WHERE name = '1st Year B Sec'), '2410', '2006-11-21', 1,
 (SELECT id FROM batches WHERE batch_name = '2024 - 2025'), 7, 'Tamil', 1,
 'https://randomuser.me/api/portraits/men/50.jpg',
 '9100000030', 'studying');

-- ============================================================
-- 15. STUDENT OTHER DETAILS
-- ============================================================
-- religion_id = 1 (Muslim) for every student
-- ============================================================

INSERT INTO student_other_details
(student_id, religion_id, caste_id, social_category_id,
 madhab_id, is_orphan, aadhar_no, medical_remarks, notes)
SELECT
    s.id, 1, NULL, NULL, NULL, 0,
    CONCAT('80000000', LPAD(s.id, 4, '0')),
    NULL, 'Seed data'
FROM students s
ORDER BY s.id;


-- ============================================================
-- 16. STUDENT ACADEMIC DETAILS
-- ============================================================

INSERT INTO student_academic_details
(student_id, rrn, univ_email, yoj, yoc,
 madras_course, madras_roll_no, madras_joining_year)
SELECT
    s.id,
    CONCAT('RRN', s.roll_number),
    CONCAT(s.roll_number, '@university.edu'),
    b.start_year,
    b.end_year,
    'Islamic Studies',
    CONCAT('MR', s.roll_number),
    b.start_year
FROM students s
JOIN batches b ON b.id = s.batch_id
ORDER BY s.id;


-- ============================================================
-- 17. STUDENT FAMILY DETAILS
-- ============================================================

INSERT INTO student_family_details
(student_id, father_name, father_mobile, father_education,
 father_occupation, father_annual_income, mother_name, mother_mobile,
 mother_education, mother_occupation, mother_annual_income,
 parent_email, parent_whatsapp, parent_sms, guardian_name,
 guardian_mobile, guardian_relationship, guardian_address)
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
-- 18. STUDENT ADDRESSES
-- ============================================================
-- address_type: 1 = Permanent, 2 = Present
-- Every student receives both addresses.
-- ============================================================

INSERT INTO student_addresses
(student_id, address_type, door_no, street, area, city,
 district, state, country, pin_code)
SELECT
    id, 1, CONCAT(id, '-B'), 'Main Road', 'Muslim Nagar',
    'Chennai', 'Chennai', 'Tamil Nadu', 'India', '600002'
FROM students;

INSERT INTO student_addresses
(student_id, address_type, door_no, street, area, city,
 district, state, country, pin_code)
SELECT
    id, 2, CONCAT(id, '-A'), 'College Road', 'Islamic Nagar',
    'Chennai', 'Chennai', 'Tamil Nadu', 'India', '600001'
FROM students;


-- ============================================================
-- 19. STUDENT QUALIFICATIONS
-- ============================================================
-- Exactly 3 qualifications for every student: 10th, 11th, 12th
-- (12th is completed in the batch's start year)
-- ============================================================

INSERT INTO student_qualifications
(student_id, level, school_name, board, medium, passing_year,
 passing_month, school_address, reg_number, marks, total_marks, emis)
SELECT
    s.id, '10th', 'Al Huda Higher Secondary School', 'State Board',
    'English', b.start_year - 2, 'March', 'Chennai, Tamil Nadu, India',
    CONCAT('10', s.roll_number), 420.00, 500.00,
    CONCAT('EMIS10', s.roll_number)
FROM students s JOIN batches b ON b.id = s.batch_id

UNION ALL

SELECT
    s.id, '11th', 'Al Huda Higher Secondary School', 'State Board',
    'English', b.start_year - 1, 'March', 'Chennai, Tamil Nadu, India',
    CONCAT('11', s.roll_number), 440.00, 500.00,
    CONCAT('EMIS11', s.roll_number)
FROM students s JOIN batches b ON b.id = s.batch_id

UNION ALL

SELECT
    s.id, '12th', 'Al Huda Higher Secondary School', 'State Board',
    'English', b.start_year, 'March', 'Chennai, Tamil Nadu, India',
    CONCAT('12', s.roll_number), 455.00, 500.00,
    CONCAT('EMIS12', s.roll_number)
FROM students s JOIN batches b ON b.id = s.batch_id;


-- ============================================================
-- 20. STUDENT EXTRA QUALIFICATIONS
-- ============================================================

INSERT INTO student_extra_qualifications
(student_id, course_name, cert_url)
SELECT
    id,
    'Certificate in Quran Recitation',
    CONCAT('https://example.com/certificates/', roll_number, '.pdf')
FROM students;


-- ============================================================
-- 21. STUDENT ADMISSION DETAILS
-- ============================================================

INSERT INTO student_admission_details
(student_id, admission_date, entrance_mark, entrance_rank,
 hafiz, recommended_by)
SELECT
    s.id,
    STR_TO_DATE(CONCAT(b.start_year, '-06-10'), '%Y-%m-%d'),
    82.50,
    s.id,
    0,
    'College Admission Committee'
FROM students s
JOIN batches b ON b.id = s.batch_id;


-- ============================================================
-- 22. STUDENT RELATED LINKS
-- ============================================================

INSERT INTO student_related_links
(student_id, description, url)
SELECT
    id,
    'Student Profile',
    CONCAT('https://example.com/students/', roll_number)
FROM students;


-- ============================================================
-- 23. STUDENT ACADEMIC ENROLLMENTS
-- ============================================================
-- Every student is enrolled in the current academic year
-- (2024-2025) in the classroom assigned in the students table.
-- ============================================================

INSERT INTO student_academic_enrollments
(academic_year_id, student_id, classroom_id, enrollment_status)
SELECT
    (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1),
    s.id,
    s.classroom_id,
    'active'
FROM students s
WHERE s.classroom_id IS NOT NULL
ORDER BY s.id;


-- ============================================================
-- SEED DATA COMPLETE
-- ============================================================
