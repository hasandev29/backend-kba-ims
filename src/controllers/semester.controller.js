// src/controllers/semester.controller.js

// =============================================================================
// semester.controller.js
//
// Responsibilities:
//   1. Run FK existence check for course_id BEFORE any INSERT / UPDATE
//      (body validation itself happens in the routes file via the
//      `validate` middleware, same as timetables).
//   2. Duplicate (course_id, name) is caught via the DB's UNIQUE constraint
//      (uq_semester_course_name) — surfaced as a clean 409 here.
//   3. Hand off DB writes/reads to semester.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { pool } = require("../config/db");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createSemester,
  findSemesterById,
  getAllSemesters,
  countAllSemesters,
  updateSemester,
} = require("../models/semester.model");

// -----------------------------------------------------------------------------
// Shared FK pre-flight helper — checks course_id only when present in data.
// -----------------------------------------------------------------------------
const checkFKs = async (data) => {
  if (data.course_id !== null && data.course_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM courses WHERE id = ? LIMIT 1`, [data.course_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        course_id: `course_id ${data.course_id} does not exist in courses.`,
      });
    }
  }
};

// -----------------------------------------------------------------------------
// POST /api/semesters
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  await checkFKs(req.validatedBody);

  let semesterId;
  try {
    semesterId = await createSemester(req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `A semester named "${req.validatedBody.name}" already exists for this course.`,
      });
    }
    throw err;
  }

  const created = await findSemesterById(semesterId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Semester created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/semesters/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findSemesterById(id);
  if (!existing) throw ApiError.notFound("Semester not found.");

  await checkFKs(req.validatedBody);

  try {
    await updateSemester(id, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `A semester named "${req.validatedBody.name}" already exists for this course.`,
      });
    }
    throw err;
  }

  const updated = await findSemesterById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Semester updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/semesters/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const semester = await findSemesterById(id);
  if (!semester) throw ApiError.notFound("Semester not found.");

  return res.status(200).json(new ApiResponse(200, semester, "Semester fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/semesters?page=&limit=&course_id=&is_active=&q=
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const { course_id, is_active, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    course_id: course_id !== undefined ? Number(course_id) : undefined,
    is_active: is_active !== undefined ? Number(is_active) : undefined,
    search,
  };

  const [semesters, total] = await Promise.all([
    getAllSemesters({ ...filters, limit, offset }),
    countAllSemesters(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, semesters, "Semesters fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

module.exports = { create, getById, getAll, update };