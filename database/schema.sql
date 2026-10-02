-- ============================================================
-- COLLEGE ERP DATABASE SCHEMA
-- ============================================================
-- Table creation order:
--
-- 1.  batches
-- 1B. courses
-- 1C. semesters
-- 2.  users
-- 3.  staff
-- 4.  staff_employment_details
-- 5.  staff_qualifications
-- 6.  staff_addresses
-- 7.  staff_other_details
-- 8.  classrooms
-- 9.  subjects
-- 10. students
-- 11. student_other_details
-- 12. student_academic_details
-- 13. student_family_details
-- 14. student_addresses
-- 15. student_qualifications
-- 16. student_extra_qualifications
-- 17. student_admission_details
-- 18. student_related_links
--
-- ============================================================


-- ============================================================
-- 1. BATCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course VARCHAR(100) NOT NULL,
    batch_name VARCHAR(100) NOT NULL UNIQUE,
    start_year YEAR NOT NULL,
    end_year YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 1B. COURSES
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_courses_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 1C. SEMESTERS
-- Depends on: courses
-- ============================================================

CREATE TABLE IF NOT EXISTS semesters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    name VARCHAR(50) NOT NULL,
    sem_order INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_semesters_course_name (course_id, name),

    CONSTRAINT fk_semesters_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NULL,
    role ENUM( 'superadmin', 'admin', 'staff', 'student', 'parent', 'dev', 
    'accountant' ) NOT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_id (user_id),
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. STAFF
-- Depends on: users
-- ============================================================

CREATE TABLE IF NOT EXISTS staff (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    staff_uid VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NULL,
    short_name VARCHAR(50) NULL,
    salutation TINYINT(1) NULL,
    gender TINYINT(1) NULL,
    dob DATE NULL,
    blood_group TINYINT(1) NULL,
    mobile_number VARCHAR(20) NULL,
    emergency_contact VARCHAR(20) NULL,
    personal_email VARCHAR(150) NULL,
    religion_id INT UNSIGNED NULL,
    marital_status TINYINT(1) NULL,
    medical_remarks TEXT NULL,
    photo_url VARCHAR(500) NULL,
    date_of_joining DATE NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. STAFF EMPLOYMENT DETAILS
-- Depends on: staff
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_employment_details (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL UNIQUE,
    staff_type INT UNSIGNED NULL,
    designation INT UNSIGNED  NULL,
    experience_years DECIMAL(4,1) NULL,
    employment_nature INT UNSIGNED NULL,
    employment_place INT UNSIGNED NULL,
    university_id VARCHAR(100) NULL,
    university_designation INT UNSIGNED  NULL,
    university_experience DECIMAL(4,1) NULL,
    work_email VARCHAR(150) NULL,
    notes TEXT NULL,

    FOREIGN KEY (staff_id)
        REFERENCES staff(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. STAFF QUALIFICATIONS
-- Depends on: staff
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_qualifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL UNIQUE,
    qualifications TEXT NULL,

    FOREIGN KEY (staff_id)
        REFERENCES staff(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. STAFF ADDRESSES
-- Depends on: staff
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_addresses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL,
    address_type TINYINT(1) NOT NULL,
    door_no VARCHAR(50) NULL,
    street VARCHAR(200) NULL,
    area VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pin_code VARCHAR(10) NULL,
    country VARCHAR(100) NULL,

    FOREIGN KEY (staff_id)
        REFERENCES staff(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. STAFF OTHER DETAILS
-- Depends on: staff
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_other_details (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL UNIQUE,
    aadhar_no VARCHAR(20) NULL,
    aadhar_doc_url VARCHAR(500) NULL,
    pan_no VARCHAR(20) NULL,
    pan_doc_url VARCHAR(500) NULL,

    FOREIGN KEY (staff_id)
        REFERENCES staff(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. CLASSROOMS
-- ============================================================
-- No foreign-key constraints are currently defined here.
-- advisor_id, leader_id, batch_id and course are currently
-- ordinary indexed columns in the supplied schema.

CREATE TABLE IF NOT EXISTS classrooms (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    room_no VARCHAR(50) NULL,
    semester INT UNSIGNED NULL,
    advisor_id INT UNSIGNED NULL,
    leader_id INT UNSIGNED NULL,
    batch_id INT UNSIGNED NULL,
    course INT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_semester (semester),
    INDEX idx_batch_id (batch_id),
    INDEX idx_course (course),
    INDEX idx_is_active (is_active),

    CONSTRAINT chk_classrooms_semester
        CHECK (semester IS NULL OR semester BETWEEN 1 AND 8)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. SUBJECTS
-- Depends on: classrooms
-- ============================================================

CREATE TABLE IF NOT EXISTS subjects (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(150) NULL,
    book_name VARCHAR(200) NULL,
    description TEXT NULL,
    course INT UNSIGNED NOT NULL,
    semester INT UNSIGNED NULL,
    term INT UNSIGNED NOT NULL,
    credits DECIMAL(4,1) NULL,
    univ_credits DECIMAL(4,1) NULL,
    classroom_id INT UNSIGNED NULL,
    course_staff_id INT UNSIGNED NULL,
    handling_staff_id INT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_subject_code (code),

    INDEX idx_course (course),
    INDEX idx_term (term),
    INDEX idx_semester (semester),
    INDEX idx_classroom_id (classroom_id),
    INDEX idx_is_active (is_active),

    CONSTRAINT fk_subjects_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. STUDENTS
-- Depends on: users, classrooms, batches
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    classroom_id INT UNSIGNED NULL,
    roll_number VARCHAR(50) NULL,
    dob DATE NULL,
    gender TINYINT NULL,
    batch_id INT UNSIGNED NULL,
    blood_group TINYINT UNSIGNED NULL,
    mother_tongue VARCHAR(100) NULL,
    is_hostel TINYINT(1) NULL,
    photo_url VARCHAR(500) NULL,
    mobile_number VARCHAR(20) NULL,
    academic_status ENUM( 'studying', 'graduated', 'dropout', 'transferred', 
    'suspended' ) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_students_roll_number (roll_number),
    UNIQUE KEY uq_students_user_id (user_id),

    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_students_classroom
        FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id),

    CONSTRAINT fk_students_batch
        FOREIGN KEY (batch_id)
        REFERENCES batches(id)
        ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. STUDENT OTHER DETAILS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_other_details (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    religion_id TINYINT UNSIGNED NULL,
    caste_id SMALLINT UNSIGNED NULL,
    social_category_id TINYINT UNSIGNED NULL,
    madhab_id TINYINT UNSIGNED NULL,
    is_orphan TINYINT(1) NOT NULL DEFAULT 0,
    aadhar_no VARCHAR(12) NULL,
    medical_remarks TEXT NULL,
    notes TEXT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_other_student (student_id),
    UNIQUE KEY uq_other_aadhar (aadhar_no),

    CONSTRAINT fk_other_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. STUDENT ACADEMIC DETAILS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_academic_details (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    rrn VARCHAR(50) NULL,
    univ_email VARCHAR(150) NULL,
    yoj YEAR NULL,
    yoc YEAR NULL,
    madras_course VARCHAR(100) NULL,
    madras_roll_no VARCHAR(50) NULL,
    madras_joining_year YEAR NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_academic_student (student_id),
    UNIQUE KEY uq_academic_univ_email (univ_email),

    CONSTRAINT fk_academic_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. STUDENT FAMILY DETAILS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_family_details (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    father_name VARCHAR(150) NULL,
    father_mobile VARCHAR(20) NULL,
    father_education VARCHAR(100) NULL,
    father_occupation VARCHAR(100) NULL,
    father_annual_income INT UNSIGNED NULL,
    mother_name VARCHAR(150) NULL,
    mother_mobile VARCHAR(20) NULL,
    mother_education VARCHAR(100) NULL,
    mother_occupation VARCHAR(100) NULL,
    mother_annual_income INT UNSIGNED NULL,
    parent_email VARCHAR(150) NULL,
    parent_whatsapp VARCHAR(20) NULL,
    parent_sms VARCHAR(20) NULL,
    guardian_name VARCHAR(150) NULL,
    guardian_mobile VARCHAR(20) NULL,
    guardian_relationship VARCHAR(100) NULL,
    guardian_address TEXT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_family_student (student_id),

    CONSTRAINT fk_family_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 14. STUDENT ADDRESSES
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_addresses (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    address_type TINYINT NOT NULL,
    door_no VARCHAR(20) NULL,
    street VARCHAR(150) NULL,
    area VARCHAR(150) NULL,
    city VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    pin_code VARCHAR(10) NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_address_student_type (student_id, address_type),

    CONSTRAINT fk_address_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 15. STUDENT QUALIFICATIONS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_qualifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    level VARCHAR(50) NOT NULL,
    school_name VARCHAR(200) NULL,
    board VARCHAR(150) NULL,
    medium VARCHAR(100) NULL,
    passing_year YEAR NULL,
    passing_month VARCHAR(20) NULL,
    school_address TEXT NULL,
    reg_number VARCHAR(50) NULL,
    marks DECIMAL(8,2) NULL,
    total_marks DECIMAL(8,2) NULL,
    emis VARCHAR(20) NULL,

    UNIQUE KEY uq_qual_student_level (student_id, level),

    CONSTRAINT fk_qual_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 16. STUDENT EXTRA QUALIFICATIONS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_extra_qualifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    cert_url VARCHAR(500) NULL,

    CONSTRAINT fk_extra_qual_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 17. STUDENT ADMISSION DETAILS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_admission_details (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    admission_date DATE NULL,
    entrance_mark DECIMAL(6,2) NULL,
    entrance_rank INT UNSIGNED NULL,
    hafiz TINYINT(1) NULL,
    recommended_by VARCHAR(150) NULL,

    UNIQUE KEY uq_admission_student (student_id),

    CONSTRAINT fk_admission_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 18. STUDENT RELATED LINKS
-- Depends on: students
-- ============================================================

CREATE TABLE IF NOT EXISTS student_related_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    description VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,

    CONSTRAINT fk_links_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================