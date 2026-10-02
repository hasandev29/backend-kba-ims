// src/models/attendance.model.js

// =============================================================================
// attendance.model.js
//
// DB operations for attendance_sessions + its attendance_records children.
//
//   - createAttendanceSession()  inserts the session header, then bulk-inserts
//     one attendance_records row per student in a single transaction. A
//     session is written exactly once per (timetable_slot_id, attendance_date)
//     — the DB-level UNIQUE KEY (see attendance.sql) is the backstop, but the
//     controller also pre-checks so we can return a clean 409 instead of a
//     raw duplicate-key error.
//   - findAttendanceSessionById()  returns the session header + all of its
//     student records, joined with student name/roll_number for display.
//   - getAllAttendanceSessions() / countAllAttendanceSessions()  paginated
//     listing with filters — header rows only (no student records), same
//     split as getAllTimetables/countAllTimetables.
//
// FK / business-rule checks (classroom_id, subject_id, staff_id, period_id,
// timetable_slot_id, and per-student existence + classroom membership) are
// handled in the controller before calling these functions.
//
// Exports: createAttendanceSession | findAttendanceSessionById |
//          getAllAttendanceSessions | countAllAttendanceSessions
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createAttendanceSession
// =============================================================================
const createAttendanceSession = async (data) => {
  const {
    academic_term_id,
    timetable_slot_id,
    additional_class_id,
    attendance_date,
    classroom_id,
    subject_id,
    staff_id,
    session_type,
    session_status,
    remarks,
    created_by,
    students,
  } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO attendance_sessions
         (academic_term_id, timetable_slot_id, additional_class_id, attendance_date, classroom_id, subject_id, staff_id,
          session_type, session_status, submitted_at, remarks, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [
        academic_term_id,
        timetable_slot_id ?? null,
        additional_class_id ?? null,
        attendance_date,
        classroom_id,
        subject_id,
        staff_id,
        session_type,
        session_status ?? "completed",
        remarks ?? null,
        created_by ?? null,
        created_by ?? null,
      ]
    );
    const sessionId = result.insertId;

    const recordRows = students.map((s) => [
      sessionId,
      s.student_id,
      s.attendance_status,
      s.check_in_time ?? null,
      s.remarks ?? null,
    ]);

    await connection.query(
      `INSERT INTO attendance_records (session_id, student_id, attendance_status, check_in_time, remarks)
       VALUES ?`,
      [recordRows]
    );

    await connection.commit();
    return sessionId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findAttendanceSessionById
// Returns the header row plus every student's attendance record, joined with
// student name/roll_number for display.
// =============================================================================
const findAttendanceSessionById = async (id) => {
  const [[session]] = await pool.query(
    `SELECT id, academic_term_id, timetable_slot_id, additional_class_id, attendance_date, classroom_id, subject_id, staff_id,
            session_type, session_status, submitted_at, remarks, created_by, updated_by, created_at, updated_at
     FROM attendance_sessions
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  if (!session) return undefined;

  const [records] = await pool.query(
    `SELECT ar.id, ar.student_id, st.name AS student_name, st.roll_number,
            ar.attendance_status, ar.check_in_time, ar.remarks
     FROM attendance_records ar
     LEFT JOIN students st ON st.id = ar.student_id
     WHERE ar.session_id = ?
     ORDER BY st.roll_number ASC`,
    [id]
  );

  return { ...session, students: records };
};

// =============================================================================
// Shared WHERE-clause builder for filters (kept private, mirrors
// buildFilterClause in timetable.model.js so listing + counting never drift)
// =============================================================================
const buildFilterClause = ({
  academic_term_id,
  classroom_id,
  subject_id,
  staff_id,
  timetable_slot_id,
  session_type,
  session_status,
  attendance_date,
  date_from,
  date_to,
}) => {
  // Lists all session types (regular, makeup, extra). Use the session_type
  // filter to narrow down.
  let clause = " WHERE 1 = 1";
  const values = [];

  if (academic_term_id   !== undefined) { clause += " AND academic_term_id = ?";   values.push(academic_term_id); }
  if (classroom_id       !== undefined) { clause += " AND classroom_id = ?";       values.push(classroom_id); }
  if (subject_id         !== undefined) { clause += " AND subject_id = ?";         values.push(subject_id); }
  if (staff_id           !== undefined) { clause += " AND staff_id = ?";           values.push(staff_id); }
  if (timetable_slot_id  !== undefined) { clause += " AND timetable_slot_id = ?";  values.push(timetable_slot_id); }
  if (session_type       !== undefined) { clause += " AND session_type = ?";       values.push(session_type); }
  if (session_status     !== undefined) { clause += " AND session_status = ?";     values.push(session_status); }
  if (attendance_date    !== undefined) { clause += " AND attendance_date = ?";    values.push(attendance_date); }
  if (date_from          !== undefined) { clause += " AND attendance_date >= ?";   values.push(date_from); }
  if (date_to            !== undefined) { clause += " AND attendance_date <= ?";   values.push(date_to); }

  return { clause, values };
};

// =============================================================================
// getAllAttendanceSessions
// Header rows only — use findAttendanceSessionById for a session's full
// student list.
// =============================================================================
const getAllAttendanceSessions = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, academic_term_id, timetable_slot_id, additional_class_id, attendance_date, classroom_id, subject_id, staff_id,
           session_type, session_status, submitted_at, remarks, created_by, updated_by, created_at, updated_at
    FROM attendance_sessions
    ${clause}
    ORDER BY attendance_date DESC, id DESC
  `;

  const params = [...values];

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};

// =============================================================================
// countAllAttendanceSessions (for pagination meta)
// =============================================================================
const countAllAttendanceSessions = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM attendance_sessions ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// findSessionByDateAndSlot — used by the controller to pre-check the
// "one session per period per day" rule before attempting an insert.
// =============================================================================
const findSessionByDateAndSlot = async (attendance_date, timetable_slot_id) => {
  const [[row]] = await pool.query(
    `SELECT id FROM attendance_sessions WHERE attendance_date = ? AND timetable_slot_id = ? LIMIT 1`,
    [attendance_date, timetable_slot_id]
  );
  return row;
};

// One session per additional class (mirrors UNIQUE KEY uq_as_additional_class).
const findSessionByAdditionalClassId = async (additional_class_id) => {
  const [[row]] = await pool.query(
    `SELECT id FROM attendance_sessions WHERE additional_class_id = ? LIMIT 1`,
    [additional_class_id]
  );
  return row;
};

module.exports = {
  findSessionByAdditionalClassId,
  createAttendanceSession,
  findAttendanceSessionById,
  getAllAttendanceSessions,
  countAllAttendanceSessions,
  findSessionByDateAndSlot,
};