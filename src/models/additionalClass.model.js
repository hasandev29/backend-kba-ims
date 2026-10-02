// src/models/additionalClass.model.js

// =============================================================================
// additionalClass.model.js
//
// DB operations for additional_classes (+ the attendance_sessions /
// attendance_records rows created alongside it).
//
// Exports: createAdditionalClass | createAdditionalClassWithAttendance |
//          findAdditionalClassById | findAdditionalClassRawById |
//          findAttendanceSessionByClassId | getAllAdditionalClasses |
//          countAllAdditionalClasses | findConflictingAdditionalClasses |
//          updateAdditionalClass | deleteAdditionalClassIfNoAttendance
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// Dates are formatted in SQL so they always come back as "YYYY-MM-DD" strings
// (no JS Date / timezone shifts) — this also makes merging with PATCH input safe.
const CLASS_COLUMNS = `
  ac.id, ac.academic_term_id, ac.classroom_id, ac.subject_id, ac.staff_id,
  DATE_FORMAT(ac.class_date, '%Y-%m-%d') AS class_date,
  ac.start_time, ac.end_time, ac.class_type,
  DATE_FORMAT(ac.original_class_date, '%Y-%m-%d') AS original_class_date,
  ac.original_period_no, ac.reason, ac.status,
  ac.created_by, ac.updated_by, ac.created_at, ac.updated_at`;

// Columns returned by the get-all list (raw column values, exactly as stored).
const LIST_COLUMNS = `
  ac.id, ac.academic_term_id, ac.classroom_id, ac.subject_id, ac.staff_id,
  ac.class_date, ac.start_time, ac.end_time, ac.class_type,
  ac.original_class_date, ac.original_period_no, ac.reason, ac.status`;

// ---------------------------------------------------------------------------
// !! Adjust the table / column names below if your schema differs !!
//   name columns: classrooms.name, subjects.name, staff.name,
//                 academic_terms.name
// ---------------------------------------------------------------------------
const DISPLAY_COLUMNS = `
  cl.name                 AS classroom_name,
  sub.name                AS subject_name,
  sf.name                 AS staff_name,
  term.name               AS academic_term_name`;

const JOINS = `
  LEFT JOIN classrooms     cl   ON cl.id   = ac.classroom_id
  LEFT JOIN subjects       sub  ON sub.id  = ac.subject_id
  LEFT JOIN staff          sf   ON sf.id   = ac.staff_id
  LEFT JOIN academic_terms term ON term.id = ac.academic_term_id`;

// Columns a PATCH is allowed to write.
const UPDATABLE_COLUMNS = [
  "academic_term_id", "classroom_id", "subject_id", "staff_id",
  "class_date", "start_time", "end_time", "class_type",
  "original_class_date", "original_period_no", "reason", "status",
];

// Inserts the additional_classes row using the given connection/pool.
const insertAdditionalClass = async (conn, data) => {
  const [result] = await conn.query(
    `INSERT INTO additional_classes
       (academic_term_id, classroom_id, subject_id, staff_id,
        class_date, start_time, end_time, class_type,
        original_class_date, original_period_no, reason, status,
        created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.academic_term_id,
      data.classroom_id,
      data.subject_id,
      data.staff_id,
      data.class_date,
      data.start_time,
      data.end_time,
      data.class_type,
      data.original_class_date ?? null,
      data.original_period_no ?? null,
      data.reason || null,
      data.status ?? "scheduled",
      data.created_by ?? null,
      data.created_by ?? null,
    ]
  );
  return result.insertId;
};

// =============================================================================
// createAdditionalClass — class only
// =============================================================================
const createAdditionalClass = async (data) => insertAdditionalClass(pool, data);

// =============================================================================
// createAdditionalClassWithAttendance
// One transaction: additional_classes -> attendance_sessions -> attendance_records
// Returns { additionalClassId, sessionId }
// =============================================================================
const createAdditionalClassWithAttendance = async (data) => {
  const { students, session_status, attendance_remarks, created_by } = data;

  // Keep the class status in step with the attendance session.
  const classStatus =
    session_status === "completed" ? "completed"
    : session_status === "cancelled" ? "cancelled"
    : "scheduled"; // draft

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const additionalClassId = await insertAdditionalClass(connection, {
      ...data,
      status: classStatus,
    });

    const [sessionResult] = await connection.query(
      `INSERT INTO attendance_sessions
         (academic_term_id, timetable_slot_id, additional_class_id, attendance_date,
          classroom_id, subject_id, staff_id, session_type, session_status,
          submitted_at, remarks, created_by, updated_by)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [
        data.academic_term_id,
        additionalClassId,
        data.class_date,
        data.classroom_id,
        data.subject_id,
        data.staff_id,
        data.class_type, // 'makeup' | 'extra' — matches chk_as_session_type
        session_status ?? "completed",
        attendance_remarks ?? null,
        created_by ?? null,
        created_by ?? null,
      ]
    );
    const sessionId = sessionResult.insertId;

    const recordRows = students.map((s) => [
      sessionId,
      s.student_id,
      s.attendance_status,
      s.check_in_time ?? null,
      s.remarks || null,
    ]);

    await connection.query(
      `INSERT INTO attendance_records (session_id, student_id, attendance_status, check_in_time, remarks)
       VALUES ?`,
      [recordRows]
    );

    await connection.commit();
    return { additionalClassId, sessionId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findAdditionalClassRawById — plain row, no joins (used by the controller for
// existence checks and for merging PATCH input).
// =============================================================================
const findAdditionalClassRawById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ${CLASS_COLUMNS} FROM additional_classes ac WHERE ac.id = ? LIMIT 1`,
    [id]
  );
  return row;
};

// =============================================================================
// findAttendanceSessionByClassId — the session (if any) linked to this class.
// =============================================================================
const findAttendanceSessionByClassId = async (additionalClassId, conn = pool) => {
  const [[session]] = await conn.query(
    `SELECT id, attendance_date, session_type, session_status, submitted_at, remarks
     FROM attendance_sessions
     WHERE additional_class_id = ?
     LIMIT 1`,
    [additionalClassId]
  );
  return session;
};

// =============================================================================
// findAdditionalClassById
// Header (+ classroom/subject/staff/term names) + attendance status
// + linked attendance session and student records.
//
//   attendance_taken  : boolean
//   attendance_status : 'not_taken' | 'draft' | 'completed' | 'cancelled'
//   attendance_summary: counts per attendance_status (null if not taken)
// =============================================================================
const findAdditionalClassById = async (id) => {
  const [[additionalClass]] = await pool.query(
    `SELECT ${CLASS_COLUMNS}, ${DISPLAY_COLUMNS}
     FROM additional_classes ac
     ${JOINS}
     WHERE ac.id = ?
     LIMIT 1`,
    [id]
  );
  if (!additionalClass) return undefined;

  const session = await findAttendanceSessionByClassId(id);

  let students = [];
  let summary = null;
  if (session) {
    [students] = await pool.query(
      `SELECT ar.id, ar.student_id, st.name AS student_name, st.roll_number,
              ar.attendance_status, ar.check_in_time, ar.remarks
       FROM attendance_records ar
       LEFT JOIN students st ON st.id = ar.student_id
       WHERE ar.session_id = ?
       ORDER BY st.roll_number ASC`,
      [session.id]
    );

    summary = { total: students.length };
    for (const s of students) {
      summary[s.attendance_status] = (summary[s.attendance_status] || 0) + 1;
    }
  }

  return {
    ...additionalClass,
    attendance_taken: Boolean(session),
    attendance_status: session ? session.session_status : "not_taken",
    attendance_summary: summary,
    attendance_session: session ? { ...session, students } : null,
  };
};

// =============================================================================
// Shared WHERE builder so listing + counting never drift.
// =============================================================================
const buildFilterClause = ({
  academic_term_id, classroom_id, subject_id, staff_id,
  class_type, status, class_date, date_from, date_to, q,
}) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (academic_term_id !== undefined) { clause += " AND ac.academic_term_id = ?";  values.push(academic_term_id); }
  if (classroom_id     !== undefined) { clause += " AND ac.classroom_id = ?";      values.push(classroom_id); }
  if (subject_id       !== undefined) { clause += " AND ac.subject_id = ?";        values.push(subject_id); }
  if (staff_id         !== undefined) { clause += " AND ac.staff_id = ?";          values.push(staff_id); }
  if (class_type       !== undefined) { clause += " AND ac.class_type = ?";        values.push(class_type); }
  if (status           !== undefined) { clause += " AND ac.status = ?";            values.push(status); }
  if (class_date       !== undefined) { clause += " AND ac.class_date = ?";        values.push(class_date); }
  // Date range — inclusive on both ends: date_from <= class_date <= date_to
  if (date_from        !== undefined) { clause += " AND ac.class_date >= ?";       values.push(date_from); }
  if (date_to          !== undefined) { clause += " AND ac.class_date <= ?";       values.push(date_to); }

  // Free-text search across the human-readable columns.
  if (q !== undefined && String(q).trim() !== "") {
    const like = `%${String(q).trim().replace(/[\\%_]/g, "\\$&")}%`;
    clause += ` AND (
      sub.name  LIKE ? OR sf.name   LIKE ? OR cl.name  LIKE ? OR
      term.name LIKE ? OR ac.reason LIKE ?
    )`;
    values.push(like, like, like, like, like);
  }

  return { clause, values };
};

// =============================================================================
// getAllAdditionalClasses — plain header rows (LIST_COLUMNS). Joins are used
// only so `q` can search subject / staff / classroom / term names.
// =============================================================================
const getAllAdditionalClasses = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT ${LIST_COLUMNS}
    FROM additional_classes ac
    ${JOINS}
    ${clause}
    ORDER BY ac.class_date DESC, ac.start_time DESC, ac.id DESC
  `;

  const params = [...values];

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};

const countAllAdditionalClasses = async (opts) => {
  const { clause, values } = buildFilterClause(opts);
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM additional_classes ac ${JOINS} ${clause}`,
    values
  );
  return total;
};

// =============================================================================
// findConflictingAdditionalClasses
// Non-cancelled additional classes on the same date whose time range overlaps
// and that use the same classroom OR the same staff member.
// Pass excludeId when editing so the class doesn't clash with itself.
// =============================================================================
const findConflictingAdditionalClasses = async ({
  class_date, start_time, end_time, classroom_id, staff_id, excludeId,
}) => {
  let sql = `SELECT id, classroom_id, staff_id, start_time, end_time
     FROM additional_classes
     WHERE class_date = ?
       AND status <> 'cancelled'
       AND start_time < ?
       AND end_time > ?
       AND (classroom_id = ? OR staff_id = ?)`;
  const params = [class_date, end_time, start_time, classroom_id, staff_id];

  if (excludeId !== undefined && excludeId !== null) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};

// =============================================================================
// updateAdditionalClass — writes only whitelisted columns that are present in
// `fields`. Returns affectedRows.
// =============================================================================
const updateAdditionalClass = async (id, fields, updatedBy) => {
  const sets = [];
  const values = [];

  for (const col of UPDATABLE_COLUMNS) {
    if (fields[col] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(fields[col]);
    }
  }
  if (!sets.length) return 0;

  sets.push("updated_by = ?");
  values.push(updatedBy ?? null);

  const [result] = await pool.query(
    `UPDATE additional_classes SET ${sets.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows;
};

// =============================================================================
// deleteAdditionalClassIfNoAttendance
// Atomic: the row is only deleted if no attendance_sessions row points at it,
// so an attendance session created between the controller's check and this
// statement can't be orphaned. Returns affectedRows (0 => not deleted).
// =============================================================================
const deleteAdditionalClassIfNoAttendance = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM additional_classes
     WHERE id = ?
       AND NOT EXISTS (
         SELECT 1 FROM attendance_sessions WHERE additional_class_id = ?
       )`,
    [id, id]
  );
  return result.affectedRows;
};

module.exports = {
  createAdditionalClass,
  createAdditionalClassWithAttendance,
  findAdditionalClassById,
  findAdditionalClassRawById,
  findAttendanceSessionByClassId,
  getAllAdditionalClasses,
  countAllAdditionalClasses,
  findConflictingAdditionalClasses,
  updateAdditionalClass,
  deleteAdditionalClassIfNoAttendance,
};