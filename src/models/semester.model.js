// src/models/semester.model.js

// =============================================================================
// semester.model.js
//
// DB operations for the semesters table.
// FK check (course_id) is handled in the controller before calling these
// functions, so the model trusts the data it receives.
//
// Exports: createSemester | findSemesterById | getAllSemesters |
//          countAllSemesters | updateSemester
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createSemester
// =============================================================================
const createSemester = async (data) => {
  const { name, course_id, is_active } = data;

  const [result] = await pool.query(
    `INSERT INTO semesters (name, course_id, is_active)
     VALUES (?, ?, ?)`,
    [name, course_id, is_active ?? 1]
  );

  return result.insertId;
};

// =============================================================================
// findSemesterById
// Includes the parent course name for display, same pattern as
// findTimetableById joining in format/subject/staff names.
// =============================================================================
const findSemesterById = async (id) => {
  const [[semester]] = await pool.query(
    `SELECT sm.id, sm.name, sm.course_id, c.name AS course_name, sm.is_active
     FROM semesters sm
     LEFT JOIN courses c ON c.id = sm.course_id
     WHERE sm.id = ?
     LIMIT 1`,
    [id]
  );
  return semester;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// =============================================================================
const buildFilterClause = ({ course_id, is_active, search }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (course_id !== undefined) { clause += " AND sm.course_id = ?"; values.push(course_id); }
  if (is_active !== undefined) { clause += " AND sm.is_active = ?"; values.push(is_active); }

  if (search) {
    clause += " AND sm.name LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllSemesters
// =============================================================================
const getAllSemesters = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT sm.id, sm.name, sm.course_id, c.name AS course_name, sm.is_active
    FROM semesters sm
    LEFT JOIN courses c ON c.id = sm.course_id
    ${clause}
    ORDER BY sm.id DESC
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
// countAllSemesters (for pagination meta)
// =============================================================================
const countAllSemesters = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM semesters sm ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateSemester — partial update, only columns present in `data` change.
// =============================================================================
const UPDATABLE_FIELDS = ["name", "course_id", "is_active"];

const updateSemester = async (id, data) => {
  const setClauses = [];
  const values = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  if (setClauses.length === 0) return false;

  await pool.query(
    `UPDATE semesters SET ${setClauses.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  return true;
};

module.exports = {
  createSemester,
  findSemesterById,
  getAllSemesters,
  countAllSemesters,
  updateSemester,
};