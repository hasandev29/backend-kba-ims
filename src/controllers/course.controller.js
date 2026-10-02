// src/controllers/course.controller.js

// =============================================================================
// course.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same pattern as timetables).
//   2. Duplicate `name` is caught via the DB's UNIQUE constraint
//      (uq_academic_term_name) — surfaced as a clean 409 here rather than
//      letting a raw ER_DUP_ENTRY bubble up.
//   3. Hand off DB writes/reads to course.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createCourse,
  findCourseById,
  getAllCourses,
  countAllCourses,
  updateCourse,
} = require("../models/course.model");

// -----------------------------------------------------------------------------
// POST /api/courses
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  let courseId;
  try {
    courseId = await createCourse(req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `A course named "${req.validatedBody.name}" already exists.`,
      });
    }
    throw err;
  }

  const created = await findCourseById(courseId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Course created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/courses/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findCourseById(id);
  if (!existing) throw ApiError.notFound("Course not found.");

  try {
    await updateCourse(id, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `A course named "${req.validatedBody.name}" already exists.`,
      });
    }
    throw err;
  }

  const updated = await findCourseById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Course updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/courses/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await findCourseById(id);
  if (!course) throw ApiError.notFound("Course not found.");

  return res.status(200).json(new ApiResponse(200, course, "Course fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/courses?page=&limit=&is_active=&is_default=&q=
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const { is_active, is_default, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    is_active: is_active !== undefined ? Number(is_active) : undefined,
    is_default: is_default !== undefined ? Number(is_default) : undefined,
    search,
  };

  const [courses, total] = await Promise.all([
    getAllCourses({ ...filters, limit, offset }),
    countAllCourses(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, courses, "Courses fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});
module.exports = { create, getById, getAll, update };