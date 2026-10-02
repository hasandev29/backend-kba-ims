-- =============================================================================
-- student_tables.sql
--
-- Run this AFTER the `users`, `batches`, and `classrooms` tables exist.
-- Tables are created in FK-dependency order.
--
-- Note: gender, blood_group, is_hostel, religion_id, caste_id,
--       social_category_id, madhab_id, is_orphan are stored as plain integers.
--       Their display values are resolved on the frontend.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. students  (master row — one per student)
--
--    gender      : plain int  e.g. 1=Male 2=Female 3=Other (frontend resolves)
--    blood_group : plain int  e.g. 1=A+  2=A-  3=B+  ...  (frontend resolves)
--    is_hostel   : TINYINT(1) 0=No 1=Yes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
  id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED      NOT NULL,
  name           VARCHAR(150)      NOT NULL,
  classroom_id   INT UNSIGNED          NULL,
  roll_number    VARCHAR(50)           NULL,
  dob            DATE                  NULL,
  gender         TINYINT               NULL,
  batch_id       INT UNSIGNED          NULL,
  blood_group    TINYINT UNSIGNED      NULL,
  mother_tongue  VARCHAR(100)          NULL,
  is_hostel      TINYINT(1)            NULL,
  photo_url      VARCHAR(500)          NULL,
  mobile_number  VARCHAR(20)           NULL,
  academic_status ENUM('studying','graduated','dropout','transferred','suspended') NOT NULL,
  created_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_students_roll_number (roll_number),
  UNIQUE KEY uq_students_user_id     (user_id),

  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id)      REFERENCES users      (id) ON DELETE CASCADE,
  CONSTRAINT fk_students_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
  CONSTRAINT fk_students_batch
    FOREIGN KEY (batch_id)     REFERENCES batches    (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. student_other_details  (1:1 with students)
--
--    religion_id, caste_id, social_category_id, madhab_id : plain integers,
--    no FK — values resolved on the frontend.
--    is_orphan   : TINYINT(1) 0=No 1=Yes
--    aadhar_no   : UNIQUE but nullable — multiple students with no Aadhaar
--                  must not collide on the UNIQUE constraint.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_other_details (
  id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  student_id          INT UNSIGNED      NOT NULL,
  religion_id         TINYINT UNSIGNED      NULL,
  caste_id            SMALLINT UNSIGNED     NULL,
  social_category_id  TINYINT UNSIGNED      NULL,
  madhab_id           TINYINT UNSIGNED      NULL,
  is_orphan           TINYINT(1)        NOT NULL DEFAULT 0,
  aadhar_no           VARCHAR(12)           NULL,
  medical_remarks     TEXT                  NULL,
  notes               TEXT                  NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_other_student (student_id),
  UNIQUE KEY uq_other_aadhar  (aadhar_no),

  CONSTRAINT fk_other_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. student_academic_details  (1:1 with students)
--
--    yoj / yoc : year of joining / completion (4-digit year)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_academic_details (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id           INT UNSIGNED  NOT NULL,
  rrn                  VARCHAR(50)       NULL,
  univ_email           VARCHAR(150)      NULL,
  yoj                  YEAR              NULL,
  yoc                  YEAR              NULL,
  madras_course        VARCHAR(100)      NULL,
  madras_roll_no       VARCHAR(50)       NULL,
  madras_joining_year  YEAR              NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_academic_student    (student_id),
  UNIQUE KEY uq_academic_univ_email (univ_email),

  CONSTRAINT fk_academic_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. student_family_details  (1:1 with students)
--
--    annual_income : INT UNSIGNED allows 0 (e.g. homemaker)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_family_details (
  id                     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  student_id             INT UNSIGNED   NOT NULL,
  father_name            VARCHAR(150)       NULL,
  father_mobile          VARCHAR(20)        NULL,
  father_education       VARCHAR(100)       NULL,
  father_occupation      VARCHAR(100)       NULL,
  father_annual_income   INT UNSIGNED       NULL,
  mother_name            VARCHAR(150)       NULL,
  mother_mobile          VARCHAR(20)        NULL,
  mother_education       VARCHAR(100)       NULL,
  mother_occupation      VARCHAR(100)       NULL,
  mother_annual_income   INT UNSIGNED       NULL,
  parent_email           VARCHAR(150)       NULL,
  parent_whatsapp        VARCHAR(20)        NULL,
  parent_sms             VARCHAR(20)        NULL,
  guardian_name          VARCHAR(150)       NULL,
  guardian_mobile        VARCHAR(20)        NULL,
  guardian_relationship  VARCHAR(100)       NULL,
  guardian_address       TEXT               NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_family_student (student_id),

  CONSTRAINT fk_family_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. addresses  (1:N with students)
--
--    address_type : plain int  0=Present  1=Permanent
--    UNIQUE (student_id, address_type) — one row per type per student
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_addresses (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id    INT UNSIGNED  NOT NULL,
  address_type  TINYINT       NOT NULL,
  door_no       VARCHAR(20)       NULL,
  street        VARCHAR(150)      NULL,
  area          VARCHAR(150)      NULL,
  city          VARCHAR(100)      NULL,
  district      VARCHAR(100)      NULL,
  state         VARCHAR(100)      NULL,
  country       VARCHAR(100)      NULL,
  pin_code      VARCHAR(10)       NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_address_student_type (student_id, address_type),

  CONSTRAINT fk_address_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. qualifications  (1:N with students)
--
--    level examples : '10th', '11th', '12th', 'UG', 'PG'
--    UNIQUE (student_id, level) — one row per qualification level per student
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_qualifications (
  id             INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  student_id     INT UNSIGNED    NOT NULL,
  level          VARCHAR(50)     NOT NULL,
  school_name    VARCHAR(200)        NULL,
  board          VARCHAR(150)        NULL,
  medium         VARCHAR(100)        NULL,
  passing_year   YEAR                NULL,
  passing_month  VARCHAR(20)         NULL,
  school_address TEXT                NULL,
  reg_number     VARCHAR(50)         NULL,
  marks          DECIMAL(8,2)        NULL,
  total_marks    DECIMAL(8,2)        NULL,
  emis           VARCHAR(20)         NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_qual_student_level (student_id, level),

  CONSTRAINT fk_qual_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. student_extra_qualifications  (1:N with students)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_extra_qualifications (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id  INT UNSIGNED  NOT NULL,
  course_name VARCHAR(200)  NOT NULL,
  cert_url    VARCHAR(500)      NULL,

  PRIMARY KEY (id),

  CONSTRAINT fk_extra_qual_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. student_admission_details  (1:1 with students)
--
--    hafiz : TINYINT(1)  0=No  1=Yes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_admission_details (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id      INT UNSIGNED  NOT NULL,
  admission_date  DATE              NULL,
  entrance_mark   DECIMAL(6,2)      NULL,
  entrance_rank   INT UNSIGNED      NULL,
  hafiz           TINYINT(1)        NULL,
  recommended_by  VARCHAR(150)      NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_admission_student (student_id),

  CONSTRAINT fk_admission_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. student_related_links  (1:N with students)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS student_related_links (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  student_id  INT UNSIGNED  NOT NULL,
  description VARCHAR(200)  NOT NULL,
  url         VARCHAR(500)  NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT fk_links_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;