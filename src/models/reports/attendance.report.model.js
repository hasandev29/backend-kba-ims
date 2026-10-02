// src/models/reports/attendance.report.model.js

"use strict";

const { pool } = require("../../config/db");

// =============================================================================
// STUDENT WISE REPORT
// =============================================================================

// Student basic details (+ rrn) — only if the student belongs to the classroom
const findStudentForReport = async (student_id, classroom_id) => {
  const sql = `
    SELECT
      s.id           AS student_id,
      s.name         AS student_name,
      s.roll_number  AS roll_no,
      sad.rrn        AS rrn
    FROM students s
    LEFT JOIN student_academic_details sad ON sad.student_id = s.id
    WHERE s.id = ? AND s.classroom_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [student_id, classroom_id]);
  return rows[0];
};

// -----------------------------------------------------------------------------
// Subject-wise present / OD / absent counts for ONE student.
//
// - Starts from `subjects` so every subject of the classroom is listed,
//   even when no attendance has been taken yet (counts = 0).
// - Only 'completed' sessions are counted (draft / cancelled are ignored).
// - Sessions are filtered by academic_term_id and classroom_id.
// -----------------------------------------------------------------------------
const getStudentSubjectWiseAttendance = async ({
  academic_term_id,
  classroom_id,
  student_id,
}) => {
  const sql = `
    SELECT
      sub.id            AS id,
      sub.code          AS code,
      sub.name          AS name,
      sub.short_name    AS short_name,
      sub.display_name  AS display_name,
      sub.semester      AS semester,
      sub.term          AS term,
      sub.credits       AS credits,
      sub.univ_credits  AS univ_credits,
      sub.is_active     AS is_active,
      COALESCE(SUM(ar.attendance_status = 'present'), 0) AS present_days,
      COALESCE(SUM(ar.attendance_status = 'od'),      0) AS od_days,
      COALESCE(SUM(ar.attendance_status = 'absent'),  0) AS absent_days
    FROM subjects sub
    LEFT JOIN attendance_sessions ats
           ON ats.subject_id       = sub.id
          AND ats.academic_term_id = ?
          AND ats.classroom_id     = ?
          AND ats.session_status   = 'completed'
    LEFT JOIN attendance_records ar
           ON ar.session_id = ats.id
          AND ar.student_id = ?
    WHERE sub.classroom_id = ?
    GROUP BY
      sub.id, sub.code, sub.name, sub.short_name, sub.display_name,
      sub.semester, sub.term, sub.credits, sub.univ_credits, sub.is_active
    ORDER BY sub.semester ASC, sub.term ASC, sub.code ASC
  `;

  const [rows] = await pool.query(sql, [
    academic_term_id,
    classroom_id,
    student_id,
    classroom_id,
  ]);

  return rows;
};

// =============================================================================
// SUBJECT WISE REPORT
// =============================================================================

// Subject details — only if the subject belongs to the classroom
const findSubjectForReport = async (subject_id, classroom_id) => {
  const sql = `
    SELECT
      id, code, name, short_name, display_name,
      semester, term, credits, univ_credits, is_active
    FROM subjects
    WHERE id = ? AND classroom_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [subject_id, classroom_id]);
  return rows[0];
};

// -----------------------------------------------------------------------------
// Student-wise present / OD / absent counts for ONE subject.
//
// - Starts from `students` so every student of the classroom is listed,
//   even when no attendance has been recorded for them (counts = 0).
// - Only 'completed' sessions are counted (draft / cancelled are ignored).
// - Sessions are filtered by academic_term_id, classroom_id and subject_id.
// -----------------------------------------------------------------------------
const getSubjectStudentWiseAttendance = async ({
  academic_term_id,
  classroom_id,
  subject_id,
}) => {
  const sql = `
    SELECT
      s.id           AS student_id,
      s.name         AS student_name,
      s.roll_number  AS roll_no,
      sad.rrn        AS rrn,
      COALESCE(SUM(ar.attendance_status = 'present'), 0) AS present_days,
      COALESCE(SUM(ar.attendance_status = 'od'),      0) AS od_days,
      COALESCE(SUM(ar.attendance_status = 'absent'),  0) AS absent_days
    FROM students s
    LEFT JOIN student_academic_details sad
           ON sad.student_id = s.id
    LEFT JOIN attendance_sessions ats
           ON ats.subject_id       = ?
          AND ats.academic_term_id = ?
          AND ats.classroom_id     = ?
          AND ats.session_status   = 'completed'
    LEFT JOIN attendance_records ar
           ON ar.session_id = ats.id
          AND ar.student_id = s.id
    WHERE s.classroom_id = ?
    GROUP BY s.id, s.name, s.roll_number, sad.rrn
    ORDER BY s.roll_number ASC, s.name ASC
  `;

  const [rows] = await pool.query(sql, [
    subject_id,
    academic_term_id,
    classroom_id,
    classroom_id,
  ]);

  return rows;
};

module.exports = {
  findStudentForReport,
  getStudentSubjectWiseAttendance,
  findSubjectForReport,
  getSubjectStudentWiseAttendance,
};