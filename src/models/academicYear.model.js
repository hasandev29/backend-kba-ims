// src/models/academicYear.model.js

// =============================================================================
// academicYear.model.js
//
// DB operations for the academic_years table.
//
// NOTE (deviation from the plain courses mirror): only one academic year
// should realistically be "current" at a time, so createAcademicYear /
// updateAcademicYear wrap the write in a transaction that first clears
// is_current on every other row whenever the incoming row sets is_current
// to true. Remove the transaction blocks below if you'd rather allow
// multiple "current" years, matching courses.is_default exactly.
//
// Exports: createAcademicYear | findAcademicYearById | getAllAcademicYears |
//          countAllAcademicYears | updateAcademicYear
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createAcademicYear
// =============================================================================
const createAcademicYear = async (data) => {
  const { name, start_date, end_date, is_current } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (is_current) {
      await conn.query(`UPDATE academic_years SET is_current = 0 WHERE is_current = 1`);
    }

    const [result] = await conn.query(
      `INSERT INTO academic_years (name, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?)`,
      [name, start_date, end_date, is_current ?? 0]
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
// findAcademicYearById
// =============================================================================
const findAcademicYearById = async (id) => {
  const [[year]] = await pool.query(
    `SELECT id, name, start_date, end_date, is_current
     FROM academic_years
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return year;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// =============================================================================
const buildFilterClause = ({ is_current, search }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (is_current !== undefined) { clause += " AND is_current = ?"; values.push(is_current); }

  if (search) {
    clause += " AND name LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllAcademicYears
// =============================================================================
const getAllAcademicYears = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, name, start_date, end_date, is_current
    FROM academic_years
    ${clause}
    ORDER BY start_date ASC
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
// countAllAcademicYears (for pagination meta)
// =============================================================================
const countAllAcademicYears = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM academic_years ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateAcademicYear — partial update, only columns present in `data` change.
// =============================================================================
const UPDATABLE_FIELDS = ["name", "start_date", "end_date", "is_current"];

const updateAcademicYear = async (id, data) => {
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
      await conn.query(`UPDATE academic_years SET is_current = 0 WHERE is_current = 1 AND id != ?`, [id]);
    }

    await conn.query(
      `UPDATE academic_years SET ${setClauses.join(", ")} WHERE id = ?`,
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
  createAcademicYear,
  findAcademicYearById,
  getAllAcademicYears,
  countAllAcademicYears,
  updateAcademicYear,
};