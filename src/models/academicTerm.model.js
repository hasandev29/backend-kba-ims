// src/models/academicTerm.model.js

// =============================================================================
// academicTerm.model.js
//
// DB operations for the academic_terms table.
// Exports: createAcademicTerm | findAcademicTermById | getAllAcademicTerms |
//          countAllAcademicTerms | updateAcademicTerm | unsetCurrentTerm
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// unsetCurrentTerm
//
// Only one term per course should be "current" at a time. The schema does
// not enforce this via a partial unique index, so it's handled here at the
// application layer inside the same connection/transaction as the write
// that sets is_current = true.
// =============================================================================
const unsetCurrentTerm = async (conn, courseId, exceptId = null) => {
  const sql = exceptId
    ? `UPDATE academic_terms SET is_current = FALSE WHERE course_id = ? AND id != ?`
    : `UPDATE academic_terms SET is_current = FALSE WHERE course_id = ?`;

  const values = exceptId ? [courseId, exceptId] : [courseId];

  await conn.query(sql, values);
};

// =============================================================================
// createAcademicTerm
// =============================================================================
const createAcademicTerm = async (data) => {
  const {
    course_id,
    name,
    term_type,
    start_date,
    end_date,
    is_current,
    is_active,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (is_current) {
      await unsetCurrentTerm(conn, course_id);
    }

    const [result] = await conn.query(
      `INSERT INTO academic_terms
         (course_id, name, term_type, start_date, end_date, is_current, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        name,
        term_type,
        start_date,
        end_date,
        is_current ?? 0,
        is_active ?? 1,
      ]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// =============================================================================
// findAcademicTermById
// =============================================================================
const findAcademicTermById = async (id) => {
  const [[term]] = await pool.query(
    `SELECT id, course_id, name, term_type, start_date, end_date,
            is_current, is_active, created_at, updated_at
     FROM academic_terms
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return term;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// =============================================================================
const buildFilterClause = ({ course_id, term_type, is_current, is_active, search }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (course_id !== undefined) { clause += " AND course_id = ?"; values.push(course_id); }
  if (term_type !== undefined) { clause += " AND term_type = ?"; values.push(term_type); }
  if (is_current !== undefined) { clause += " AND is_current = ?"; values.push(is_current); }
  if (is_active !== undefined) { clause += " AND is_active = ?"; values.push(is_active); }

  if (search) {
    clause += " AND name LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllAcademicTerms
// =============================================================================
const getAllAcademicTerms = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, course_id, name, term_type, start_date, end_date,
           is_current, is_active, created_at, updated_at
    FROM academic_terms
    ${clause}
    ORDER BY start_date DESC, id DESC
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
// countAllAcademicTerms (for pagination meta)
// =============================================================================
const countAllAcademicTerms = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM academic_terms ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateAcademicTerm — partial update, only columns present in `data` change.
// =============================================================================
const UPDATABLE_FIELDS = [
  "course_id",
  "name",
  "term_type",
  "start_date",
  "end_date",
  "is_current",
  "is_active",
];

const updateAcademicTerm = async (id, data, existing) => {
  const setClauses = [];
  const values = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  if (setClauses.length === 0) return false;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (data.is_current === true) {
      const courseId = data.course_id ?? existing.course_id;
      await unsetCurrentTerm(conn, courseId, id);
    }

    await conn.query(
      `UPDATE academic_terms SET ${setClauses.join(", ")} WHERE id = ?`,
      [...values, id]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  createAcademicTerm,
  findAcademicTermById,
  getAllAcademicTerms,
  countAllAcademicTerms,
  updateAcademicTerm,
};