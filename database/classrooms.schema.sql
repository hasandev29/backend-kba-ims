CREATE TABLE IF NOT EXISTS classrooms (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,

  name        VARCHAR(150)  NOT NULL,
  room_no     VARCHAR(50)   NULL,
  term        INT UNSIGNED  NULL,
  semester    INT UNSIGNED  NULL,
  advisor_id  INT UNSIGNED  NULL,
  leader_id   INT UNSIGNED  NULL,
  batch_id    INT UNSIGNED  NULL,
  course      INT UNSIGNED  NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,

  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_term      (term),
  INDEX idx_semester  (semester),
  INDEX idx_batch_id  (batch_id),
  INDEX idx_course    (course),
  INDEX idx_is_active (is_active),

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;