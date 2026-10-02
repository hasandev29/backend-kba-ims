-- =============================================================================
-- staff.schema.sql
--
-- Run this after your existing `users` table is in place.
-- All staff tables follow the same normalized pattern as the student schema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE 1 — staff  (master row, personal details)
-- -----------------------------------------------------------------------------
CREATE TABLE staff (
  id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED  NOT NULL,          -- FK → users.id
  staff_uid         VARCHAR(50)   NOT NULL UNIQUE,   -- e.g. ABK-STF-001
  name              VARCHAR(150)  NULL,
  short_name        VARCHAR(50)   NULL,
  salutation        TINYINT(1)    NULL,              -- 1=Mr 2=Mrs 3=Ms 4=Dr 5=Prof
  gender            TINYINT(1)    NULL,-- 1=Male 2=Female 3=Other
  dob               DATE          NULL,
  blood_group       TINYINT(1)    NULL,
  mobile_number     VARCHAR(20)   NULL,
  emergency_contact VARCHAR(20)   NULL,
  personal_email    VARCHAR(150)  NULL,
  religion_id       INT UNSIGNED  NULL,
  marital_status    TINYINT(1)    NULL,              -- 1=Single 2=Married 3=Divorced 4=Widowed
  medical_remarks   TEXT          NULL,
  photo_url         VARCHAR(500)  NULL,
  date_of_joining   DATE          NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 2 — staff_employment_details  (1:1)
-- -----------------------------------------------------------------------------
CREATE TABLE staff_employment_details (
  id                     INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  staff_id               INT UNSIGNED  NOT NULL UNIQUE,
  staff_type             INT UNSIGNED  NULL,
  designation            INT UNSIGNED  NULL,
  experience_years       DECIMAL(4,1)  NULL,
  employment_nature      INT UNSIGNED  NULL,
  employment_place       INT UNSIGNED  NULL,
  university_id          VARCHAR(100)  NULL,
  university_designation INT UNSIGNED  NULL,
  university_experience  DECIMAL(4,1)  NULL,
  work_email             VARCHAR(150)  NULL,
  notes                  TEXT          NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 3 — staff_qualifications  (1:1)
-- Single TEXT field mirrors the UI textarea (comma-separated degrees).
-- -----------------------------------------------------------------------------
CREATE TABLE staff_qualifications (
  id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  staff_id       INT UNSIGNED  NOT NULL UNIQUE,
  qualifications TEXT          NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 4 — staff_addresses  (1:N)
-- address_type: 1 = Permanent, 2 = Present
-- -----------------------------------------------------------------------------
CREATE TABLE staff_addresses (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  staff_id     INT UNSIGNED  NOT NULL,
  address_type TINYINT(1)    NOT NULL,
  door_no      VARCHAR(50)   NULL,
  street       VARCHAR(200)  NULL,
  area         VARCHAR(200)  NULL,
  city         VARCHAR(100)  NULL,
  district     VARCHAR(100)  NULL,
  state        VARCHAR(100)  NULL,
  pin_code     VARCHAR(10)   NULL,
  country      VARCHAR(100)  NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE 5 — staff_other_details  (1:1 — Aadhaar + PAN)
-- -----------------------------------------------------------------------------
CREATE TABLE staff_other_details (
  id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  staff_id       INT UNSIGNED  NOT NULL UNIQUE,
  aadhar_no      VARCHAR(20)   NULL,
  aadhar_doc_url VARCHAR(500)  NULL,
  pan_no         VARCHAR(20)   NULL,
  pan_doc_url    VARCHAR(500)  NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;