// src/models/classroom.model.js

// =============================================================================
// classroom.model.js
//
// DB operations for the classrooms table.
//
// FK pre-flight checks (advisor_id → staff, leader_id → students,
// batch_id → batches) are handled in the controller before calling these
// functions, so the model trusts the data it receives.
//
// Exports: createClassroom | findClassroomById | getAllClassrooms
//          countAllClassrooms | updateClassroom
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createClassroom
// =============================================================================
const createClassroom = async (data) => {
  const {
    name,
    room_no,
    semester,
    advisor_id,
    leader_id,
    batch_id,
    course,
    is_active,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO classrooms
       (name, room_no, semester, advisor_id, leader_id, batch_id, course, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      room_no    ?? null,
      semester   ?? null,
      advisor_id ?? null,
      leader_id  ?? null,
      batch_id   ?? null,
      course,
      is_active  ?? 1,
    ]
  );

  return result.insertId;
};

// =============================================================================
// findClassroomById
// =============================================================================
const findClassroomById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT id, name, room_no, semester,
            advisor_id, leader_id, batch_id, course, is_active,
            created_at, updated_at
     FROM classrooms
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return row ?? undefined;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// (kept private — used by both getAllClassrooms and countAllClassrooms so
// the two queries can never drift apart)
// =============================================================================
const buildFilterClause = ({ semester, advisor_id, leader_id, batch_id, course, is_active, search }) => {
  let clause   = " WHERE 1=1";
  const values = [];

  if (semester   !== undefined) { clause += " AND semester = ?";   values.push(semester);   }
  if (advisor_id !== undefined) { clause += " AND advisor_id = ?"; values.push(advisor_id); }
  if (leader_id  !== undefined) { clause += " AND leader_id = ?";  values.push(leader_id);  }
  if (batch_id   !== undefined) { clause += " AND batch_id = ?";   values.push(batch_id);   }
  if (course     !== undefined) { clause += " AND course = ?";     values.push(course);     }
  if (is_active  !== undefined) { clause += " AND is_active = ?";  values.push(is_active);  }

  if (search) {
    clause += " AND (name LIKE ? OR room_no LIKE ?)";
    const like = `%${search}%`;
    values.push(like, like);
  }

  return { clause, values };
};

// =============================================================================
// getAllClassrooms
// Supports filters: semester, advisor_id, leader_id, batch_id, course,
// is_active, plus `search` across name & room_no. Paginated.
// =============================================================================
const getAllClassrooms = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, name, room_no, semester,
           advisor_id, leader_id, batch_id, course, is_active,
           created_at, updated_at
    FROM classrooms
    ${clause}
    ORDER BY id DESC
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
// countAllClassrooms (for pagination meta)
// =============================================================================
const countAllClassrooms = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM classrooms ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// getClassroomsList
// Trimmed, non-paginated list. Filters: course, is_active, plus
// `search` across name & room_no. Reuses buildFilterClause — semester /
// advisor_id / leader_id simply stay undefined and are skipped by it.
// =============================================================================
const getClassroomsList = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `
    SELECT id, name, room_no, semester, course, is_active
    FROM classrooms
    ${clause}
    ORDER BY id DESC
  `;

  const [rows] = await pool.query(sql, values);
  return rows;
};

// =============================================================================
// updateClassroom
// Partial update — only columns present in `data` are changed.
// =============================================================================
const UPDATABLE_FIELDS = [
  "name", "room_no", "semester",
  "advisor_id", "leader_id", "batch_id", "course", "is_active",
];

const updateClassroom = async (id, data) => {
  const setClauses = [];
  const values     = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  if (setClauses.length === 0) return false;

  values.push(id);

  const [result] = await pool.query(
    `UPDATE classrooms SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};

// =============================================================================
// bulkUpdateClassroomStatus
// =============================================================================
const bulkUpdateClassroomStatus = async (ids, isActive) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update against a wrong id would be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM classrooms WHERE id IN (?) FOR UPDATE`,
      [ids]
    );
    if (existingRows.length !== ids.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = ids.filter((id) => !foundIds.has(id));
      const err = new Error(`Classroom id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `UPDATE classrooms SET is_active = ? WHERE id IN (?)`,
      [isActive, ids]
    );

    await connection.commit();
    return { updated_count: ids.length, ids };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createClassroom,
  findClassroomById,
  getAllClassrooms,
  countAllClassrooms,
  getClassroomsList,
  updateClassroom,
  bulkUpdateClassroomStatus,
};