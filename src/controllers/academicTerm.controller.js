// src/controllers/academicTerm.controller.js

// =============================================================================
// academicTerm.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same pattern as courses).
//   2. Duplicate (course_id, name) is caught via the DB's UNIQUE constraint
//      (uq_academic_term_course_name) — surfaced as a clean 409 here rather
//      than letting a raw ER_DUP_ENTRY bubble up.
//   3. An unknown/invalid course_id is caught via the FK constraint
//      (fk_academic_term_course) — surfaced as a clean 400 here rather than
//      letting a raw ER_NO_REFERENCED_ROW_2 bubble up.
//   4. Hand off DB writes/reads to academicTerm.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createAcademicTerm,
  findAcademicTermById,
  getAllAcademicTerms,
  countAllAcademicTerms,
  updateAcademicTerm,
} = require("../models/academicTerm.model");

// -----------------------------------------------------------------------------
// Shared error mapper for FK / unique violations
// -----------------------------------------------------------------------------
const mapWriteError = (err, body) => {
  if (err.code === "ER_DUP_ENTRY") {
    return new ApiError(409, "Duplicate reference.", {
      name: `A term named "${body.name}" already exists for this course.`,
    });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
    return new ApiError(400, "Invalid reference.", {
      course_id: `Course with id "${body.course_id}" does not exist.`,
    });
  }
  return null;
};

// -----------------------------------------------------------------------------
// POST /api/academic-terms
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  let termId;
  try {
    termId = await createAcademicTerm(req.validatedBody);
  } catch (err) {
    const mapped = mapWriteError(err, req.validatedBody);
    if (mapped) throw mapped;
    throw err;
  }

  const created = await findAcademicTermById(termId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Academic term created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/academic-terms/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findAcademicTermById(id);
  if (!existing) throw ApiError.notFound("Academic term not found.");

  try {
    await updateAcademicTerm(id, req.validatedBody, existing);
  } catch (err) {
    const mapped = mapWriteError(err, { ...existing, ...req.validatedBody });
    if (mapped) throw mapped;
    throw err;
  }

  const updated = await findAcademicTermById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Academic term updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-terms/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const term = await findAcademicTermById(id);
  if (!term) throw ApiError.notFound("Academic term not found.");

  return res.status(200).json(new ApiResponse(200, term, "Academic term fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-terms?page=&limit=&course_id=&term_type=&is_current=&is_active=&q=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const { course_id, term_type, is_current, is_active, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    course_id: course_id !== undefined ? Number(course_id) : undefined,
    term_type: term_type !== undefined ? term_type : undefined,
    is_current: is_current !== undefined ? Number(is_current) : undefined,
    is_active: is_active !== undefined ? Number(is_active) : undefined,
    search,
  };

  const [terms, total] = await Promise.all([
    getAllAcademicTerms({ ...filters, limit, offset }),
    countAllAcademicTerms(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, terms, "Academic terms fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

module.exports = { create, getById, getAll, update };