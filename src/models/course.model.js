// src/models/course.model.js

// =============================================================================
// course.model.js
//
// DB operations for the courses table.
// Exports: createCourse | findCourseById | getAllCourses | countAllCourses |
//          updateCourse
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createCourse
// =============================================================================
const createCourse = async (data) => {
  const { name, is_default, is_active } = data;

  const [result] = await pool.query(
    `INSERT INTO courses (name, is_default, is_active)
     VALUES (?, ?, ?)`,
    [name, is_default ?? 0, is_active ?? 1]
  );

  return result.insertId;
};

// =============================================================================
// findCourseById
// =============================================================================
const findCourseById = async (id) => {
  const [[course]] = await pool.query(
    `SELECT id, name, is_default, is_active
     FROM courses
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return course;
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// =============================================================================
const buildFilterClause = ({ is_active, is_default, search }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (is_active !== undefined) { clause += " AND is_active = ?"; values.push(is_active); }
  if (is_default !== undefined) { clause += " AND is_default = ?"; values.push(is_default); }

  if (search) {
    clause += " AND name LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllCourses
// =============================================================================
const getAllCourses = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, name, is_default, is_active
    FROM courses
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
// countAllCourses (for pagination meta)
// =============================================================================
const countAllCourses = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM courses ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateCourse — partial update, only columns present in `data` change.
// =============================================================================
const UPDATABLE_FIELDS = ["name", "is_default", "is_active"];

const updateCourse = async (id, data) => {
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
    `UPDATE courses SET ${setClauses.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  return true;
};

module.exports = {
  createCourse,
  findCourseById,
  getAllCourses,
  countAllCourses,
  updateCourse,
};