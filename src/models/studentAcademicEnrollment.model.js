// src/models/studentAcademicEnrollment.model.js

// =============================================================================
// studentAcademicEnrollment.model.js
//
// DB operations for the student_academic_enrollments table.
// Exports: createEnrollment | findEnrollmentById | getAllEnrollments |
//          countAllEnrollments | updateEnrollment
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createEnrollment
// =============================================================================
// `executor` defaults to `pool` (standalone calls, e.g. from the enrollment
// controller) but can be handed a transaction `connection` (e.g. from
// student.model.js createStudent) so the insert commits/rolls back with
// everything else in that transaction.
const createEnrollment = async (data, executor = pool) => {
  const { academic_year_id, student_id, classroom_id, enrollment_status } = data;

  const [result] = await executor.query(
    `INSERT INTO student_academic_enrollments
       (academic_year_id, student_id, classroom_id, enrollment_status)
     VALUES (?, ?, ?, ?)`,
    [academic_year_id, student_id, classroom_id, enrollment_status ?? "active"]
  );

  return result.insertId;
};

// =============================================================================
// findEnrollmentById
// =============================================================================
const findEnrollmentById = async (id) => {
  const [[enrollment]] = await pool.query(
    `SELECT id, academic_year_id, student_id, classroom_id, enrollment_status,
            created_at, updated_at
     FROM student_academic_enrollments
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return enrollment;
};

// =============================================================================
// Shared WHERE-clause builder for filters
// =============================================================================
const buildFilterClause = ({ academic_year_id, student_id, classroom_id, enrollment_status }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (academic_year_id !== undefined) { clause += " AND academic_year_id = ?"; values.push(academic_year_id); }
  if (student_id !== undefined) { clause += " AND student_id = ?"; values.push(student_id); }
  if (classroom_id !== undefined) { clause += " AND classroom_id = ?"; values.push(classroom_id); }
  if (enrollment_status) { clause += " AND enrollment_status = ?"; values.push(enrollment_status); }

  return { clause, values };
};

// =============================================================================
// getAllEnrollments
// =============================================================================
const getAllEnrollments = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, academic_year_id, student_id, classroom_id, enrollment_status,
           created_at, updated_at
    FROM student_academic_enrollments
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
// countAllEnrollments (for pagination meta)
// =============================================================================
const countAllEnrollments = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM student_academic_enrollments ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateEnrollment — partial update, only columns present in `data` change.
// =============================================================================
const UPDATABLE_FIELDS = ["academic_year_id", "student_id", "classroom_id", "enrollment_status"];

const updateEnrollment = async (id, data) => {
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
    `UPDATE student_academic_enrollments SET ${setClauses.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  return true;
};

// =============================================================================
// promoteStudents
//
// PATCH /api/students/promote — moves a batch of students into `classroomId`
// for `academicYearId` in one shot.
//
// Implemented as a bulk upsert against student_academic_enrollments' unique
// key (academic_year_id, student_id):
//   - no row yet for that (year, student)         → a new row is inserted
//   - a row already exists for that (year, student) → its classroom_id and
//     enrollment_status are updated instead
// so re-running a promotion for students already placed in that year is
// safe/idempotent rather than throwing a duplicate-key error.
//
// @param  {number[]} studentIds
// @param  {number}   academicYearId
// @param  {number}   classroomId
// @returns {{promoted_count:number, student_ids:number[], academic_year_id:number, classroom_id:number}}
// @throws  {Error} code "ER_NOT_FOUND" if any student id doesn't exist
// =============================================================================
const promoteStudents = async (studentIds, academicYearId, classroomId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock + verify every id exists first — same rationale as
    // bulkUpdateStudentFields: a partial promotion across a wrong id would
    // be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM students WHERE id IN (?) FOR UPDATE`,
      [studentIds]
    );
    if (existingRows.length !== studentIds.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing  = studentIds.filter((id) => !foundIds.has(id));
      const err = new Error(`Student id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `INSERT INTO student_academic_enrollments
         (academic_year_id, student_id, classroom_id, enrollment_status)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         classroom_id = VALUES(classroom_id),
         enrollment_status = VALUES(enrollment_status)`,
      [studentIds.map((id) => [academicYearId, id, classroomId, "active"])]
    );

    await connection.commit();

    return {
      promoted_count   : studentIds.length,
      student_ids      : studentIds,
      academic_year_id : academicYearId,
      classroom_id     : classroomId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createEnrollment,
  findEnrollmentById,
  getAllEnrollments,
  countAllEnrollments,
  updateEnrollment,
  promoteStudents
};