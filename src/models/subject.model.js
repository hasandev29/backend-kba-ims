// src/models/subject.model.js

// =============================================================================
// subject.model.js
//
// DB operations for the subjects table.
//
// FK pre-flight checks (classroom_id → classrooms, course_staff_id → staff,
// handling_staff_id → staff) are handled in the controller.
//
// Exports: createSubject | findSubjectById | getAllSubjects
//          getSubjectsByFilters | updateSubject
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// Columns returned in every SELECT
const SELECT_COLS = `
  id, code, name, display_name, book_name, description,
  course, semester, term, credits, univ_credits,
  classroom_id, course_staff_id, handling_staff_id,
  is_active, created_at, updated_at
`;

// =============================================================================
// createSubject
// =============================================================================
const createSubject = async (data) => {
  const {
    code,
    name,
    display_name,
    book_name,
    description,
    course,
    semester,
    term,
    credits,
    univ_credits,
    classroom_id,
    course_staff_id,
    handling_staff_id,
    is_active,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO subjects
       (code, name, display_name, book_name, description,
        course, semester, term, credits, univ_credits,
        classroom_id, course_staff_id, handling_staff_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      name,
      display_name      ?? null,
      book_name         ?? null,
      description       ?? null,
      course,
      semester          ?? null,
      term,
      credits           ?? null,
      univ_credits      ?? null,
      classroom_id      ?? null,
      course_staff_id   ?? null,
      handling_staff_id ?? null,
      is_active         ?? 1,
    ]
  );

  return result.insertId;
};

// =============================================================================
// findSubjectById
// =============================================================================
const findSubjectById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT ${SELECT_COLS} FROM subjects WHERE id = ? LIMIT 1`,
    [id]
  );
  return row ?? undefined;
};

// =============================================================================
// findSubjectByCode  — used for duplicate check in controller
// =============================================================================
const findSubjectByCode = async (code, excludeId = null) => {
  let sql    = `SELECT id FROM subjects WHERE code = ? LIMIT 1`;
  const vals = [code];

  if (excludeId !== null) {
    sql = `SELECT id FROM subjects WHERE code = ? AND id != ? LIMIT 1`;
    vals.push(excludeId);
  }

  const [[row]] = await pool.query(sql, vals);
  return row ?? undefined;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// (kept private — used by both getAllSubjects and countAllSubjects so the
// two queries can never drift apart; mirrors classroom.model.js)
// =============================================================================
const buildFilterClause = ({
  course, semester, term, classroom_id, course_staff_id, handling_staff_id, is_active, search,
}) => {
  let clause   = " WHERE 1=1";
  const values = [];

  if (course             !== undefined) { clause += " AND course = ?";             values.push(course);             }
  if (semester           !== undefined) { clause += " AND semester = ?";           values.push(semester);           }
  if (term               !== undefined) { clause += " AND term = ?";               values.push(term);               }
  if (classroom_id       !== undefined) { clause += " AND classroom_id = ?";       values.push(classroom_id);       }
  if (course_staff_id    !== undefined) { clause += " AND course_staff_id = ?";    values.push(course_staff_id);    }
  if (handling_staff_id  !== undefined) { clause += " AND handling_staff_id = ?";  values.push(handling_staff_id);  }
  if (is_active          !== undefined) { clause += " AND is_active = ?";          values.push(is_active);          }

  if (search) {
    clause += " AND (name LIKE ? OR code LIKE ?)";
    const like = `%${search}%`;
    values.push(like, like);
  }

  return { clause, values };
};

// =============================================================================
// getAllSubjects
// Supports filters: course, semester, term, classroom_id, course_staff_id,
// handling_staff_id, is_active, plus `search` across name & code. Paginated.
// =============================================================================
const getAllSubjects = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT ${SELECT_COLS}
    FROM subjects
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
// countAllSubjects (for pagination meta)
// =============================================================================
const countAllSubjects = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM subjects ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateSubject
//
// Partial update — only columns present in `data` are changed.
// @returns {boolean} true if a row was actually changed
// =============================================================================
const UPDATABLE_FIELDS = [
  "code", "name", "display_name", "book_name", "description",
  "course", "semester", "term", "credits", "univ_credits",
  "classroom_id", "course_staff_id", "handling_staff_id", "is_active",
];

const updateSubject = async (id, data) => {
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
    `UPDATE subjects SET ${setClauses.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};

// =============================================================================
// bulkUpdateSubjectStatus
// =============================================================================
const bulkUpdateSubjectStatus = async (ids, isActive) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update against a wrong id would be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM subjects WHERE id IN (?) FOR UPDATE`,
      [ids]
    );
    if (existingRows.length !== ids.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = ids.filter((id) => !foundIds.has(id));
      const err = new Error(`Subject id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `UPDATE subjects SET is_active = ? WHERE id IN (?)`,
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
  createSubject,
  findSubjectById,
  findSubjectByCode,
  getAllSubjects,
  countAllSubjects,
  updateSubject,
  bulkUpdateSubjectStatus,
};