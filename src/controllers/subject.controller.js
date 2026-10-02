// src/controllers/subject.controller.js

"use strict";

// =============================================================================
// subject.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same as classroom.controller.js).
//   2. Duplicate code check.
//   3. FK existence checks for classroom_id, course_staff_id, handling_staff_id.
//   4. Hand off DB writes to subject.model.js.
//
// Exports: create | getById | getAll | update | bulkUpdate
// =============================================================================

const asyncHandler = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const { pool }      = require("../config/db");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createSubject,
  findSubjectById,
  findSubjectByCode,
  getAllSubjects,
  countAllSubjects,
  updateSubject,
  bulkUpdateSubjectStatus,
} = require("../models/subject.model");

// -----------------------------------------------------------------------------
// Shared FK pre-flight helper
// Checks classroom_id, course_staff_id, handling_staff_id only when present.
// -----------------------------------------------------------------------------
const checkFKs = async (data) => {

  if (data.classroom_id !== null && data.classroom_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM classrooms WHERE id = ? LIMIT 1`, [data.classroom_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        classroom_id: `classroom_id ${data.classroom_id} does not exist in classrooms.`,
      });
    }
  }

  if (data.course_staff_id !== null && data.course_staff_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM staff WHERE id = ? LIMIT 1`, [data.course_staff_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        course_staff_id: `course_staff_id ${data.course_staff_id} does not exist in staff.`,
      });
    }
  }

  if (data.handling_staff_id !== null && data.handling_staff_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM staff WHERE id = ? LIMIT 1`, [data.handling_staff_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        handling_staff_id: `handling_staff_id ${data.handling_staff_id} does not exist in staff.`,
      });
    }
  }
};

// -----------------------------------------------------------------------------
// POST /api/subjects
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const subjectData = req.validatedBody;

  const existing = await findSubjectByCode(subjectData.code);
  if (existing) {
    throw new ApiError(409, `A subject with code "${subjectData.code}" already exists.`);
  }

  await checkFKs(subjectData);

  const subjectId = await createSubject(subjectData);

  return res
    .status(201)
    .json(new ApiResponse(201, { subject_id: subjectId }, "Subject created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/subjects/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id }     = req.params;
  const updateData = req.validatedBody;

  const existing = await findSubjectById(id);
  if (!existing) throw ApiError.notFound("Subject not found.");

  if (updateData.code) {
    const duplicate = await findSubjectByCode(updateData.code, Number(id));
    if (duplicate) {
      throw new ApiError(409, `A subject with code "${updateData.code}" already exists.`);
    }
  }

  await checkFKs(updateData);

  await updateSubject(id, updateData);

  const updated = await findSubjectById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Subject updated successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/subjects/bulk
// Body: { ids: [1,2], is_active: 1 }
// -----------------------------------------------------------------------------
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateSubjectStatus(ids, is_active);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} subject(s) updated successfully.`));
});

// -----------------------------------------------------------------------------
// GET /api/subjects/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const subject = await findSubjectById(req.params.id);
  if (!subject) throw ApiError.notFound("Subject not found.");

  return res.status(200).json(new ApiResponse(200, subject, "Subject fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/subjects?page=&limit=&course=&semester=&term=&classroom_id=&course_staff_id=&handling_staff_id=&is_active=&q=
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const {
    course, semester, term, classroom_id, course_staff_id, handling_staff_id, is_active,
    q: search,
  } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    course             : course             !== undefined ? Number(course)             : undefined,
    semester           : semester           !== undefined ? Number(semester)           : undefined,
    term               : term               !== undefined ? Number(term)               : undefined,
    classroom_id       : classroom_id       !== undefined ? Number(classroom_id)       : undefined,
    course_staff_id    : course_staff_id    !== undefined ? Number(course_staff_id)    : undefined,
    handling_staff_id  : handling_staff_id  !== undefined ? Number(handling_staff_id)  : undefined,
    is_active          : is_active          !== undefined ? Number(is_active)          : undefined,
    search,
  };

  const [subjects, total] = await Promise.all([
    getAllSubjects({ ...filters, limit, offset }),
    countAllSubjects(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, subjects, "Subjects fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});
module.exports = { create, getById, getAll, update, bulkUpdate };