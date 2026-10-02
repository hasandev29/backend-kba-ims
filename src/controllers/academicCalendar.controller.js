// src/controllers/academicCalendar.controller.js

// =============================================================================
// academicCalendar.controller.js
//
// Responsibilities:
//   1. Body validation happens in the routes file via the `validate`
//      middleware (same pattern as academic_terms).
//   2. Invalid references (academic_term_id / classroom_id) are caught via
//      the DB's FK constraints — surfaced as a clean 400 here rather than
//      letting a raw ER_NO_REFERENCED_ROW_2 bubble up.
//   3. `created_by` / `updated_by` are stamped from the authenticated user,
//      never accepted from the request body (see validator — they're not
//      part of the schema at all).
//   4. Classroom scope (applies_to_all_classrooms / classroom_ids) is
//      synced into academic_calendar_classrooms by the model, inside a
//      transaction.
//   5. Hand off DB writes/reads to academicCalendar.model.js.
//
// Exports: create | getById | getAll | update
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  createAcademicCalendar,
  findAcademicCalendarById,
  getAllAcademicCalendar,
  countAllAcademicCalendar,
  updateAcademicCalendar,
} = require("../models/academicCalendar.model");

// -----------------------------------------------------------------------------
// Shared error mapper for FK violations
// -----------------------------------------------------------------------------
const mapWriteError = (err) => {
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
    const msg = err.sqlMessage || err.message || "";

    if (msg.includes("fk_acc_classroom") || msg.includes("fk_acc_calendar")) {
      return new ApiError(400, "Invalid reference.", {
        classroom_ids: "One or more given classroom_ids do not exist.",
      });
    }
    return new ApiError(400, "Invalid reference.", {
      reference: "One or more referenced records do not exist.",
    });
  }
  return null;
};

// -----------------------------------------------------------------------------
// POST /api/academic-calendar
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const payload = {
    ...req.validatedBody,
    created_by: req.user?.id ?? null,
  };

  let entryId;
  try {
    entryId = await createAcademicCalendar(payload);
  } catch (err) {
    const mapped = mapWriteError(err);
    if (mapped) throw mapped;
    throw err;
  }

  const created = await findAcademicCalendarById(entryId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Academic calendar entry created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/academic-calendar/:id
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await findAcademicCalendarById(id);
  if (!existing) throw ApiError.notFound("Academic calendar entry not found.");

  const payload = {
    ...req.validatedBody,
    updated_by: req.user?.id ?? null,
  };

  try {
    await updateAcademicCalendar(id, payload);
  } catch (err) {
    const mapped = mapWriteError(err);
    if (mapped) throw mapped;
    throw err;
  }

  const updated = await findAcademicCalendarById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Academic calendar entry updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-calendar/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await findAcademicCalendarById(id);
  if (!entry) throw ApiError.notFound("Academic calendar entry not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, entry, "Academic calendar entry fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/academic-calendar?page=&limit=&academic_term_id=&classroom_id=
//     &applies_to_all_classrooms=&event_type=&is_active=&date_from=&date_to=&q=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const {
    academic_term_id,
    classroom_id,
    applies_to_all_classrooms,
    event_type,
    affects_attendance,
    color_id,
    date_from,
    date_to,
    q: search,
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const filters = {
    academic_term_id: academic_term_id !== undefined ? Number(academic_term_id) : undefined,
    classroom_id: classroom_id !== undefined ? Number(classroom_id) : undefined,
    applies_to_all_classrooms:
      applies_to_all_classrooms !== undefined ? Number(applies_to_all_classrooms) : undefined,
    event_type: event_type !== undefined ? event_type : undefined,
    affects_attendance:
      affects_attendance !== undefined
        ? (affects_attendance === "true" || affects_attendance === true || affects_attendance === "1" ? 1 : 0)
        : undefined,
    color_id: color_id !== undefined ? Number(color_id) : undefined,
    date_from,
    date_to,
    search,
  };

  const [entries, total] = await Promise.all([
    getAllAcademicCalendar({ ...filters, limit, offset }),
    countAllAcademicCalendar(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      entries,
      "Academic calendar entries fetched successfully.",
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    )
  );
});

module.exports = { create, getById, getAll, update };