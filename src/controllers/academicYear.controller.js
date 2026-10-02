// src/controllers/academicYear.controller.js

// =============================================================================
// academicYear.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same pattern as courses/timetables).
//   2. Duplicate `name` is caught via the DB's UNIQUE constraint
//      (uq_academic_year_name) — surfaced as a clean 409 here rather than
//      letting a raw ER_DUP_ENTRY bubble up.
//   3. Hand off DB writes/reads to academicYear.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createAcademicYear,
  findAcademicYearById,
  getAllAcademicYears,
  countAllAcademicYears,
  updateAcademicYear,
} = require("../models/academicYear.model");

// -----------------------------------------------------------------------------
// POST /api/academic-years
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  let yearId;
  try {
    yearId = await createAcademicYear(req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `An academic year named "${req.validatedBody.name}" already exists.`,
      });
    }
    throw err;
  }

  const created = await findAcademicYearById(yearId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Academic year created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/academic-years/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findAcademicYearById(id);
  if (!existing) throw ApiError.notFound("Academic year not found.");

  try {
    await updateAcademicYear(id, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Duplicate reference.", {
        name: `An academic year named "${req.validatedBody.name}" already exists.`,
      });
    }
    throw err;
  }

  const updated = await findAcademicYearById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Academic year updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-years/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const year = await findAcademicYearById(id);
  if (!year) throw ApiError.notFound("Academic year not found.");

  return res.status(200).json(new ApiResponse(200, year, "Academic year fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-years?page=&limit=&is_current=&q=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const { is_current, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    is_current: is_current !== undefined ? Number(is_current) : undefined,
    search,
  };

  const [years, total] = await Promise.all([
    getAllAcademicYears({ ...filters, limit, offset }),
    countAllAcademicYears(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, years, "Academic years fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

module.exports = { create, getById, getAll, update };