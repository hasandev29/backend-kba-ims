// src/controllers/studentAcademicEnrollment.controller.js

// =============================================================================
// studentAcademicEnrollment.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same pattern as courses/timetables).
//   2. Duplicate (academic_year_id, student_id) is caught via the DB's
//      UNIQUE constraint (uq_student_academic_year) — surfaced as a clean
//      409 here rather than letting a raw ER_DUP_ENTRY bubble up.
//   3. An invalid academic_year_id / student_id / classroom_id is caught
//      via the DB's FOREIGN KEY constraints — surfaced as a clean 400
//      rather than letting a raw ER_NO_REFERENCED_ROW_2 bubble up.
//   4. Hand off DB writes/reads to studentAcademicEnrollment.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createEnrollment,
  findEnrollmentById,
  getAllEnrollments,
  countAllEnrollments,
  updateEnrollment,
  promoteStudents
} = require("../models/studentAcademicEnrollment.model");

// -----------------------------------------------------------------------------
// POST /api/student-academic-enrollments
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  let enrollmentId;
  try {
    enrollmentId = await createEnrollment(req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        student_id: "This student already has an enrollment for that academic year.",
      });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      throw new ApiError(400, "Invalid reference.", {
        reference: "academic_year_id, student_id or classroom_id does not exist.",
      });
    }
    throw err;
  }

  const created = await findEnrollmentById(enrollmentId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Enrollment created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/student-academic-enrollments/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findEnrollmentById(id);
  if (!existing) throw ApiError.notFound("Enrollment not found.");

  try {
    await updateEnrollment(id, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        student_id: "This student already has an enrollment for that academic year.",
      });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
      throw new ApiError(400, "Invalid reference.", {
        reference: "academic_year_id, student_id or classroom_id does not exist.",
      });
    }
    throw err;
  }

  const updated = await findEnrollmentById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Enrollment updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/student-academic-enrollments/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const enrollment = await findEnrollmentById(id);
  if (!enrollment) throw ApiError.notFound("Enrollment not found.");

  return res.status(200).json(new ApiResponse(200, enrollment, "Enrollment fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/student-academic-enrollments?page=&limit=&academic_year_id=&student_id=&classroom_id=&enrollment_status=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const { academic_year_id, student_id, classroom_id, enrollment_status } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    academic_year_id: academic_year_id !== undefined ? Number(academic_year_id) : undefined,
    student_id: student_id !== undefined ? Number(student_id) : undefined,
    classroom_id: classroom_id !== undefined ? Number(classroom_id) : undefined,
    enrollment_status,
  };

  const [enrollments, total] = await Promise.all([
    getAllEnrollments({ ...filters, limit, offset }),
    countAllEnrollments(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, enrollments, "Enrollments fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

// =============================================================================
// PATCH /api/students/promote
//
// Bulk classroom/academic-year promotion. Upserts one row per student_id
// against (academic_year_id, student_id): if the student already has a row
// for that year it just updates classroom_id/status, so re-running this for
// the same year/student is safe.
// =============================================================================
const bulkPromote = asyncHandler(async (req, res) => {
  const { academic_year_id, classroom_id, student_ids } = req.validatedBody;

  let result;
  try {
    result = await promoteStudents(student_ids, academic_year_id, classroom_id);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest("Invalid reference value. Check academic_year_id or classroom_id.");
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.promoted_count} students promoted successfully.`));
});

module.exports = { create, getById, getAll, update, bulkPromote };