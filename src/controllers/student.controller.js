// src/controllers/student.controller.js
//
// Responsibilities:
//   1. Body validation now happens in the router (validate(createStudentSchema)),
//      so req.validatedBody arrives already checked — matches batch.controller.js.
//   2. Run pre-flight duplicate checks using pool (NOT inside a transaction —
//      avoids holding a DB connection open during read-only SELECTs).
//   3. Hand off all DB writes to student.model.js (single transaction).
//   4. Map errors via ApiError; asyncHandler forwards anything uncaught to the
//      global error-handling middleware.
//
// Exports: create | getById | getAll | getStudentsList
//
// SECTION-EDIT HANDLERS (added)
//   One PATCH handler per section, mirroring the model split:
//     updateInfo             — users + students        (account + personal_details)
//     updateOtherDetails      — student_other_details
//     updateAcademicDetails   — student_academic_details
//     updateFamilyDetails     — student_family_details
//     updateAdmissionDetails  — student_admission_details
//     updateAddress           — student_addresses        (full replace)
//     updateQualifications    — student_qualifications   (full replace)
//     updateRelatedLinks      — student_related_links     (full replace)
//
//   NOTE on existence checks: every handler below does an explicit
//   `SELECT id FROM students WHERE id = ?` before writing, rather than
//   relying on the UPDATE's affectedRows. With mysql2's default settings,
//   affectedRows reports 0 both when no row matched the WHERE clause AND
//   when a row matched but every value sent was identical to what's already
//   stored — so it can't be used alone to distinguish "not found" from
//   "no-op update".
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");

const {
  createStudent,
  findStudentById,
  getAllStudents,
  getStudentsByFilters,
  getStudentsList,
  countStudentsList,
  updateStudent,
  bulkCreateStudents,
  bulkUpdateStudentFields,
  promoteStudents
}                 = require("../models/student.model");
const { pool }    = require("../config/db");

// -----------------------------------------------------------------------------
// ensureStudentExists (private)
// Throws ApiError.notFound if the given students.id doesn't exist.
// @returns {number} the student's user_id, for handlers that need it
// -----------------------------------------------------------------------------
const ensureStudentExists = async (id) => {
  const [[student]] = await pool.query(
    `SELECT id, user_id FROM students WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!student) throw ApiError.notFound("Student not found.");
  return student;
};

// -----------------------------------------------------------------------------
// POST /api/students
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const studentData = req.validatedBody;

  // ---------------------------------------------------------------------------
  // Pre-flight duplicate checks — run BEFORE opening the transaction so we
  // never hold a DB connection/lock open while doing read-only lookups.
  // The DB UNIQUE constraints remain as a safety net for race conditions.
  // ---------------------------------------------------------------------------

  // user_id + email — one query covers both
  const [[existingUser]] = await pool.query(
    `SELECT id FROM users WHERE user_id = ? OR email = ? LIMIT 1`,
    [studentData.account.user_id, studentData.account.email ?? null]
  );
  if (existingUser) {
    throw ApiError.conflict("A user with this user_id or email already exists.", {
      user_id: "user_id or email already in use.",
    });
  }

  // roll_number
  const [[existingRoll]] = await pool.query(
    `SELECT id FROM students WHERE roll_number = ? LIMIT 1`,
    [studentData.personal_details.roll_number]
  );
  if (existingRoll) {
    throw ApiError.conflict("A student with this roll number already exists.", {
      roll_number: "roll_number already in use.",
    });
  }

  // ---------------------------------------------------------------------------
  // Write everything to the database inside a single transaction.
  // Wrapped separately so DB-level race conditions still map to clean 4xx
  // responses instead of falling through as a generic 500.
  // ---------------------------------------------------------------------------
  let studentId;
  try {
    studentId = await createStudent(studentData);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict(
        "Duplicate entry detected. Check user_id, email, roll number, or Aadhaar."
      );
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest(
        "Invalid reference value. Check classroom_id, batch_id, or academic_year_id."
      );
    }
    if (err.code === "ER_NO_CURRENT_ACADEMIC_YEAR") {
      throw ApiError.badRequest(err.message);
    }
    throw err;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { student_id: studentId }, "Student created successfully."));
});

// =============================================================================
// POST /api/students/bulk
//
// Bulk-creates `total_students` students starting at `starting_roll_number`.
// Login (user_id) = roll_number, password = `${roll_number}@123`. Students
// log in and fill out their own name/dob/etc. via the section PATCH endpoint
// afterwards.
// =============================================================================
const bulkCreate = asyncHandler(async (req, res) => {
  const { starting_roll_number, total_students } = req.validatedBody;

  // Build the full roll-number range up front so it can be duplicate-checked
  // in one query before anything is written.
  const rollNumbers = Array.from(
    { length: total_students },
    (_, i) => String(starting_roll_number + i)
  );

  const [existing] = await pool.query(
    `SELECT roll_number AS value FROM students WHERE roll_number IN (?)
     UNION
     SELECT user_id AS value FROM users WHERE user_id IN (?)`,
    [rollNumbers, rollNumbers]
  );

  if (existing.length > 0) {
    throw ApiError.conflict(
      "One or more roll numbers in this range are already in use.",
      { roll_numbers: existing.map((r) => r.value) }
    );
  }

  let created;
  try {
    created = await bulkCreateStudents(req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict("Duplicate entry detected. Check the roll number range.");
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest(
        "Invalid reference value. Check classroom_id, batch_id, or academic_year_id."
      );
    }
    if (err.code === "ER_NO_CURRENT_ACADEMIC_YEAR") {
      throw ApiError.badRequest(err.message);
    }
    throw err;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, created, `${created.length} students created successfully.`));
});

// =============================================================================
// PATCH /api/students/bulk
//
// Applies the same field values (classroom_id, batch_id, madhab_id, yoj,
// madras_course, madras_joining_year) to every student id in the request.
// A null value for any field means "leave it untouched" — never resets it.
// =============================================================================
const bulkUpdate = asyncHandler(async (req, res) => {
  const { student_ids } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateStudentFields(student_ids, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    if (err.code === "ER_NO_FIELDS") {
      throw ApiError.badRequest(err.message);
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest("Invalid reference value. Check batch_id or madhab_id.");
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} students updated successfully.`));
});

// -----------------------------------------------------------------------------
// GET /api/students/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await findStudentById(id);
  if (!student) throw ApiError.notFound("Student not found.");

  return res.status(200).json(new ApiResponse(200, student, "Student fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/students
// Lightweight listing. Supports optional query params: ?classroom_id=&batch_id=&status=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const filters    = req.query;
  const hasFilters = Object.keys(filters).length > 0;

  const students = hasFilters
    ? await getStudentsByFilters(filters)
    : await getAllStudents();

  return res.status(200).json(
    new ApiResponse(200, students, "Students fetched successfully.", { count: students.length })
  );
});

// -----------------------------------------------------------------------------
// GET /api/students/list?academic_status=&classroom_id=&batch_name=&course=&status=&q=&page=&limit=
//
// Directory/search listing for the student list screen. Returns:
//   id, photo_url, name, roll_number, batch_id, classroom_id, email, status, hafiz
//
// Filters : academic_status, classroom_id, batch_id.name (batch_name), batch_id.course (course), status
// Search  : q — matches against name, roll_number, rrn
// -----------------------------------------------------------------------------
const getStudentsListHandler = asyncHandler(async (req, res) => {
  const { academic_status, classroom_id, batch_id, course_id, status, q } = req.query;

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const filters = {
    academic_status,
    classroom_id : classroom_id ? Number(classroom_id) : undefined,
    batch_id     : batch_id ? Number(batch_id) : undefined,
    course_id    : course_id ? Number(course_id) : undefined,
    status,
    q,
  };

  const [students, total] = await Promise.all([
    getStudentsList({ ...filters, limit, offset }),
    countStudentsList(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      students,
      "Students list fetched successfully.",
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    )
  );
});

// =============================================================================
// PATCH /api/students/:id
//
// Single PATCH endpoint for every editable section. The frontend sends only
// the node(s) it wants changed — e.g. { family_details: {...} }, or
// { personal_details: {...}, address: [...] }, or any combination.
//
// Duplicate checks below only run for fields actually present in the body,
// mirroring what each of the old per-section handlers used to check:
//   account.user_id / personal_details.email → users
//   personal_details.roll_number             → students
//   other_details.aadhar_no                  → student_other_details
//   academic_details.univ_email              → student_academic_details
//   address[].address_type (payload-internal)→ student_addresses
//   qualifications[].level (payload-internal)→ student_qualifications
// =============================================================================
const patchStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data   = req.validatedBody;

  const student = await ensureStudentExists(id);

  // ---- users: account.user_id / personal_details.email ----------------------
  const userConditions = [];
  const userValues     = [];
  if (data.account?.user_id)        { userConditions.push("user_id = ?"); userValues.push(data.account.user_id); }
  if (data.personal_details?.email) { userConditions.push("email = ?");   userValues.push(data.personal_details.email); }

  if (userConditions.length > 0) {
    const [[dupUser]] = await pool.query(
      `SELECT id FROM users WHERE (${userConditions.join(" OR ")}) AND id != ? LIMIT 1`,
      [...userValues, student.user_id]
    );
    if (dupUser) {
      throw ApiError.conflict("Another user with this user_id or email already exists.");
    }
  }

  // ---- students: personal_details.roll_number --------------------------------
  if (data.personal_details?.roll_number) {
    const [[dupRoll]] = await pool.query(
      `SELECT id FROM students WHERE roll_number = ? AND id != ? LIMIT 1`,
      [data.personal_details.roll_number, id]
    );
    if (dupRoll) {
      throw ApiError.conflict("Another student with this roll number already exists.");
    }
  }

try {
    await updateStudent(id, data);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict(
        "Duplicate entry detected. Check user_id, email, roll number, Aadhaar, university email, address type, or qualification level."
      );
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest("Invalid reference value. Check batch_id.");
    }
    if (err.code === "ER_MISSING_ID") {
      throw ApiError.badRequest(err.message);
    }
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Student updated successfully."));
});

module.exports = {
  create,
  getById,
  getAll,
  getStudentsList: getStudentsListHandler,

  // single PATCH handler
  patchStudent,

  // bulk create
  bulkCreate,
  bulkUpdate
};