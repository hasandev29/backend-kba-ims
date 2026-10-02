// src/controllers/timetableFormat.controller.js

// =============================================================================
// timetableFormat.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same as classrooms).
//   2. Translate DB-level duplicate errors (duplicate day_order/day_name,
//      duplicate period_order/period_key within a format) into friendly
//      422s — these are enforced by UNIQUE constraints in SQL, not
//      pre-flight SELECTs, since they're intra-payload rules rather than
//      FK lookups.
//   3. Hand off DB writes/reads to timetableFormat.model.js.
//
// Exports: create | getById | getAll | update | bulkUpdate
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createTimetableFormat,
  findTimetableFormatById,
  getAllTimetableFormats,
  countAllTimetableFormats,
  updateTimetableFormat,
  bulkUpdateTimetableFormatStatus,
} = require("../models/timetableFormat.model");

// -----------------------------------------------------------------------------
// Shared duplicate-entry translator
// MySQL reports duplicate UNIQUE-key hits as ER_DUP_ENTRY; surface that as a
// 422 instead of letting asyncHandler bubble it up as a raw 500.
// -----------------------------------------------------------------------------
const runOrThrowFriendly = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(
        422,
        "Duplicate day/period entry.",
        "Each day_order/day_name and period_order/period_key must be unique within a format."
      );
    }
    throw error;
  }
};

// -----------------------------------------------------------------------------
// POST /api/timetable-formats
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const formatData = req.validatedBody;

  const formatId = await runOrThrowFriendly(() => createTimetableFormat(formatData));
  const created = await findTimetableFormatById(formatId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Timetable format created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/timetable-formats/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedBody;

  const existing = await findTimetableFormatById(id);
  if (!existing) throw ApiError.notFound("Timetable format not found.");

  await runOrThrowFriendly(() => updateTimetableFormat(id, updateData));

  const updated = await findTimetableFormatById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Timetable format updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/timetable-formats/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const format = await findTimetableFormatById(id);
  if (!format) throw ApiError.notFound("Timetable format not found.");

  return res.status(200).json(new ApiResponse(200, format, "Timetable format fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/timetable-formats?page=&limit=&is_active=&q=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const { is_active, q: search } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  const filters = {
    is_active: is_active !== undefined ? Number(is_active) : undefined,
    search,
  };

  const [formats, total] = await Promise.all([
    getAllTimetableFormats({ ...filters, limit, offset }),
    countAllTimetableFormats(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, formats, "Timetable formats fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

// -----------------------------------------------------------------------------
// PATCH /api/timetable-formats/bulk
// -----------------------------------------------------------------------------
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateTimetableFormatStatus(ids, is_active);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} timetable format(s) updated successfully.`));
});

module.exports = { create, getById, getAll, update, bulkUpdate };