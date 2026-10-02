// src/controllers/timetable.controller.js

// =============================================================================
// timetable.controller.js
//
// Responsibilities:
//   1. Run FK existence checks for classroom_id and format_id BEFORE any
//      INSERT / UPDATE (body validation itself happens in the routes file
//      via the `validate` middleware, same as classrooms).
//   2. Run slot-level checks: each slot's day_id/period_id must belong to
//      the timetable's own format (and period_id must not be a
//      break/lunch period), subject_id/staff_id must exist. This is what
//      keeps a timetable's grid consistent with the format it's built on.
//   3. Stamp created_by / updated_by from the authenticated user — these
//      are never accepted from the request body.
//   4. Hand off DB writes/reads to timetable.model.js.
//
// Exports: create | getById | getAll | update | bulkUpdate
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { pool } = require("../config/db");
const { resolvePagination, buildPaginationMeta } = require("../utils/pagination");
const {
  createTimetable,
  findTimetableById,
  getAllTimetables,
  countAllTimetables,
  updateTimetable,
  bulkUpdateTimetableStatus,
} = require("../models/timetable.model");

// -----------------------------------------------------------------------------
// Shared FK pre-flight helper — checks classroom_id, format_id only when
// present in data.
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

  if (data.format_id !== null && data.format_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM timetable_formats WHERE id = ? LIMIT 1`, [data.format_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        format_id: `format_id ${data.format_id} does not exist in timetable_formats.`,
      });
    }
  }

  if (data.academic_term_id !== null && data.academic_term_id !== undefined) {
    const [[row]] = await pool.query(`SELECT id FROM academic_terms WHERE id = ? LIMIT 1`, [data.academic_term_id]);
    if (!row) {
      throw new ApiError(422, "Invalid reference.", {
        academic_term_id: `academic_term_id ${data.academic_term_id} does not exist in academic_terms.`,
      });
    }
  }
};
// -----------------------------------------------------------------------------
// Slot-level pre-flight helper — every day_id/period_id in the payload must
// belong to the timetable's own format_id, period_id must not be a
// break/lunch period, and subject_id/staff_id must exist.
// -----------------------------------------------------------------------------
const checkSlotFKs = async (slots, formatId) => {
  if (!slots?.length) return;

  const dayIds = [...new Set(slots.map((s) => s.day_id))];
  const periodIds = [...new Set(slots.map((s) => s.period_id))];
  const subjectIds = [...new Set(slots.filter((s) => s.subject_id != null).map((s) => s.subject_id))];
  const staffIds = [...new Set(slots.map((s) => s.staff_id))];

  const [validDays] = await pool.query(
    `SELECT id FROM timetable_format_days WHERE format_id = ? AND id IN (?)`,
    [formatId, dayIds]
  );
  const validDayIds = new Set(validDays.map((r) => r.id));
  const missingDays = dayIds.filter((id) => !validDayIds.has(id));
  if (missingDays.length) {
    throw new ApiError(422, "Invalid reference.", {
      day_id: `day_id(s) ${missingDays.join(", ")} do not belong to format ${formatId}.`,
    });
  }

  const [validPeriods] = await pool.query(
    `SELECT id FROM timetable_format_periods
     WHERE format_id = ? AND id IN (?) AND is_break = 0 AND is_lunch = 0`,
    [formatId, periodIds]
  );
  const validPeriodIds = new Set(validPeriods.map((r) => r.id));
  const missingPeriods = periodIds.filter((id) => !validPeriodIds.has(id));
  if (missingPeriods.length) {
    throw new ApiError(422, "Invalid reference.", {
      period_id: `period_id(s) ${missingPeriods.join(", ")} are not assignable periods (break/lunch, or don't belong to format ${formatId}).`,
    });
  }

  if (subjectIds.length) {
    const [validSubjects] = await pool.query(`SELECT id FROM subjects WHERE id IN (?)`, [subjectIds]);
    const validSubjectIds = new Set(validSubjects.map((r) => r.id));
    const missingSubjects = subjectIds.filter((id) => !validSubjectIds.has(id));
    if (missingSubjects.length) {
      throw new ApiError(422, "Invalid reference.", {
        subject_id: `subject_id(s) ${missingSubjects.join(", ")} do not exist in subjects.`,
      });
    }
  }

  const [validStaff] = await pool.query(`SELECT id FROM staff WHERE id IN (?)`, [staffIds]);
  const validStaffIds = new Set(validStaff.map((r) => r.id));
  const missingStaff = staffIds.filter((id) => !validStaffIds.has(id));
  if (missingStaff.length) {
    throw new ApiError(422, "Invalid reference.", {
      staff_id: `staff_id(s) ${missingStaff.join(", ")} do not exist in staff.`,
    });
  }
};

// -----------------------------------------------------------------------------
// POST /api/timetables
// Body includes both the timetable header fields and an (optional) initial
// `slots` array — see timetable.validator.js.
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const timetableData = { ...req.validatedBody, created_by: req.user?.id ?? null };

  await checkFKs(timetableData);
  await checkSlotFKs(timetableData.slots, timetableData.format_id);

  const timetableId = await createTimetable(timetableData);
  const created = await findTimetableById(timetableId);

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Timetable created successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/timetables/:id
// Body may contain header fields, `slots` (upsert by day_id+period_id), and
// `remove_slot_ids` (clear specific cells) — any combination, in one call.
// -----------------------------------------------------------------------------
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.validatedBody, updated_by: req.user?.id ?? null };

  const existing = await findTimetableById(id);
  if (!existing) throw ApiError.notFound("Timetable not found.");

  await checkFKs(updateData);

  if (updateData.slots?.length) {
    const effectiveFormatId = updateData.format_id ?? existing.format_id;
    await checkSlotFKs(updateData.slots, effectiveFormatId);
  }

  if (updateData.remove_slot_ids?.length) {
    const [rows] = await pool.query(
      `SELECT id FROM timetable_slots WHERE timetable_id = ? AND id IN (?)`,
      [id, updateData.remove_slot_ids]
    );
    if (rows.length !== updateData.remove_slot_ids.length) {
      const foundIds = new Set(rows.map((r) => r.id));
      const missing = updateData.remove_slot_ids.filter((sid) => !foundIds.has(sid));
      throw new ApiError(422, "Invalid reference.", {
        remove_slot_ids: `slot id(s) ${missing.join(", ")} do not belong to this timetable.`,
      });
    }
  }

  try {
    await updateTimetable(id, updateData);
  } catch (err) {
    if (err.code === "ER_VERSION_CONFLICT") {
      throw new ApiError(409, err.message, {
        version: `Expected version ${updateData.version} is stale; refetch this timetable and retry.`,
      });
    }
    throw err;
  }

  const updated = await findTimetableById(id);

  return res.status(200).json(new ApiResponse(200, updated, "Timetable updated successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/timetables/:id
// Returns header + format.days + format.periods + slots — everything
// needed to render the full grid client-side (filled or empty).
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const timetable = await findTimetableById(id);
  if (!timetable) throw ApiError.notFound("Timetable not found.");

  return res.status(200).json(new ApiResponse(200, timetable, "Timetable fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/timetables?page=&limit=&classroom_id=&format_id=&is_active=&effective_from=&effective_to=&q=
// -----------------------------------------------------------------------------

const getAll = asyncHandler(async (req, res) => {
  const {
    classroom_id, academic_term_id, format_id, is_active, effective_from, effective_to,
    effective_period, q: search,
  } = req.query;

  const { paginate, page, limit, offset } = resolvePagination(req.query);

  let effective_month, effective_year;
  if (effective_period) {
    const [mm, yyyy] = effective_period.split("-");
    effective_month = Number(mm);
    effective_year = Number(yyyy);
  }

  const filters = {
    classroom_id: classroom_id !== undefined ? Number(classroom_id) : undefined,
    academic_term_id: academic_term_id !== undefined ? Number(academic_term_id) : undefined,
    format_id: format_id !== undefined ? Number(format_id) : undefined,
    is_active: is_active !== undefined ? Number(is_active) : undefined,
    effective_from,
    effective_to,
    effective_month,
    effective_year,
    search,
  };

  const [timetables, total] = await Promise.all([
    getAllTimetables({ ...filters, limit, offset }),
    countAllTimetables(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(200, timetables, "Timetables fetched successfully.",
      buildPaginationMeta({ paginate, total, page, limit }))
  );
});

// -----------------------------------------------------------------------------
// PATCH /api/timetables/bulk
// -----------------------------------------------------------------------------
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateTimetableStatus(ids, is_active, req.user?.id ?? null);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} timetable(s) updated successfully.`));
});

module.exports = { create, getById, getAll, update, bulkUpdate };