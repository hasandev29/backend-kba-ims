// =============================================================================
// staff.controller.js
//
// Responsibilities:
//   1. Body validation happens in the router (validate(createStaffSchema) /
//      validate(patchStaffSchema)), so req.validatedBody arrives already
//      checked — matches student.controller.js.
//   2. Run pre-flight duplicate checks using pool (NOT inside a transaction —
//      avoids holding a DB connection open during read-only SELECTs).
//   3. Hand off all DB writes to staff.model.js (single transaction).
//   4. Map errors via ApiError; asyncHandler forwards anything uncaught to
//      the global error-handling middleware.
//
// Exports: create | getById | getAll | getStaffList | patchStaff
//
// NOTE on existence checks: patchStaff does an explicit
// `SELECT id, user_id FROM staff WHERE id = ?` before writing, rather than
// relying on the UPDATE's affectedRows, for the same reason documented in
// student.controller.js (affectedRows can't distinguish "not found" from
// "no-op update" with mysql2's defaults).
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");

const {
  createStaff,
  findStaffById,
  getAllStaff,
  getStaffByFilters,
  getStaffList,
  countStaffList,
  updateStaff,
  bulkUpdateStaffFields
}                 = require("../models/staff.model");
const { pool }    = require("../config/db");

// -----------------------------------------------------------------------------
// ensureStaffExists (private)
// Throws ApiError.notFound if the given staff.id doesn't exist.
// @returns {number} the staff member's user_id, for handlers that need it
// -----------------------------------------------------------------------------
const ensureStaffExists = async (id) => {
  const [[staff]] = await pool.query(
    `SELECT id, user_id FROM staff WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!staff) throw ApiError.notFound("Staff member not found.");
  return staff;
};

// -----------------------------------------------------------------------------
// POST /api/staff
// -----------------------------------------------------------------------------
const create = asyncHandler(async (req, res) => {
  const staffData = req.validatedBody;

  // ---------------------------------------------------------------------------
  // Pre-flight duplicate checks — run BEFORE opening the transaction so we
  // never hold a DB connection/lock open while doing read-only lookups.
  // The DB UNIQUE constraints remain as a safety net for race conditions.
  // ---------------------------------------------------------------------------

  // user_id + personal_email — one query covers both
  const [[existingUser]] = await pool.query(
    `SELECT id FROM users WHERE user_id = ? OR email = ? LIMIT 1`,
    [staffData.account.user_id, staffData.personal_details.personal_email]
  );
  if (existingUser) {
    throw ApiError.conflict("A user with this user_id or email already exists.", {
      user_id: "user_id or email already in use.",
    });
  }

  // staff_uid
  const [[existingUid]] = await pool.query(
    `SELECT id FROM staff WHERE staff_uid = ? LIMIT 1`,
    [staffData.personal_details.staff_uid]
  );
  if (existingUid) {
    throw ApiError.conflict("A staff member with this Staff ID already exists.", {
      staff_uid: "staff_uid already in use.",
    });
  }

  // work_email — only check when a value is actually provided
  if (staffData.employment_details?.work_email) {
    const [[existingWorkEmail]] = await pool.query(
      `SELECT id FROM staff_employment_details WHERE work_email = ? LIMIT 1`,
      [staffData.employment_details.work_email]
    );
    if (existingWorkEmail) {
      throw ApiError.conflict("A staff member with this work email already exists.", {
        work_email: "work_email already in use.",
      });
    }
  }

  // Aadhaar — only check when a value is actually provided
  if (staffData.other_details?.aadhar_no) {
    const [[existingAadhar]] = await pool.query(
      `SELECT id FROM staff_other_details WHERE aadhar_no = ? LIMIT 1`,
      [staffData.other_details.aadhar_no]
    );
    if (existingAadhar) {
      throw ApiError.conflict("A staff member with this Aadhaar number already exists.", {
        aadhar_no: "aadhar_no already in use.",
      });
    }
  }

  // PAN — only check when a value is actually provided
  if (staffData.other_details?.pan_no) {
    const [[existingPan]] = await pool.query(
      `SELECT id FROM staff_other_details WHERE pan_no = ? LIMIT 1`,
      [staffData.other_details.pan_no]
    );
    if (existingPan) {
      throw ApiError.conflict("A staff member with this PAN number already exists.", {
        pan_no: "pan_no already in use.",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Write everything to the database inside a single transaction.
  // Wrapped separately so DB-level race conditions still map to clean 4xx
  // responses instead of falling through as a generic 500.
  // ---------------------------------------------------------------------------
  let staffId;
  try {
    staffId = await createStaff(staffData);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict(
        "Duplicate entry detected. Check user_id, email, staff_uid, work email, Aadhaar, or PAN."
      );
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest("Invalid reference value. Check employment_place or university_id.");
    }
    throw err;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { staff_id: staffId }, "Staff member created successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/staff/:id
// -----------------------------------------------------------------------------
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await findStaffById(id);
  if (!staff) throw ApiError.notFound("Staff member not found.");

  return res.status(200).json(new ApiResponse(200, staff, "Staff member fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/staff
// Lightweight listing. Supports optional query params: ?staff_type=&employment_place=&status=
// -----------------------------------------------------------------------------
const getAll = asyncHandler(async (req, res) => {
  const filters    = req.query;
  const hasFilters = Object.keys(filters).length > 0;

  const staff = hasFilters
    ? await getStaffByFilters(filters)
    : await getAllStaff();

  return res.status(200).json(
    new ApiResponse(200, staff, "Staff fetched successfully.", { count: staff.length })
  );
});

// -----------------------------------------------------------------------------
// GET /api/staff/list?staff_type=&employment_place=&status=&q=&page=&limit=
//
// Directory/search listing for the staff list screen. Returns:
//   id, photo_url, name, staff_uid, staff_type, designation,
//   employment_place, email, status
//
// Filters : staff_type, employment_place, designation, status
// Search  : q — matches against name, staff_uid, work_email
// -----------------------------------------------------------------------------
const getStaffListHandler = asyncHandler(async (req, res) => {
  const { staff_type, employment_place, designation, status, q } = req.query;

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const filters = {
    staff_type       : staff_type ? Number(staff_type) : undefined,
    employment_place : employment_place ? Number(employment_place) : undefined,
    designation      : designation ? Number(designation) : undefined,
    status,
    q,
  };

  const [staff, total] = await Promise.all([
    getStaffList({ ...filters, limit, offset }),
    countStaffList(filters),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      staff,
      "Staff list fetched successfully.",
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
// PATCH /api/staff/:id
//
// Single PATCH endpoint for every editable section. The frontend sends only
// the node(s) it wants changed — e.g. { employment_details: {...} }, or
// { personal_details: {...}, address: [...] }, or any combination.
//
// Duplicate checks below only run for fields actually present in the body,
// mirroring what create checks:
//   account.user_id / personal_details.personal_email → users
//   personal_details.staff_uid                        → staff
//   employment_details.work_email                      → staff_employment_details
//   other_details.aadhar_no / other_details.pan_no      → staff_other_details
//   address[].address_type (payload-internal)          → staff_addresses
// =============================================================================
const patchStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data   = req.validatedBody;

  const staff = await ensureStaffExists(id);

  // ---- users: account.user_id / personal_details.personal_email -------------
  const userConditions = [];
  const userValues     = [];
  if (data.account?.user_id)                 { userConditions.push("user_id = ?"); userValues.push(data.account.user_id); }
  if (data.personal_details?.personal_email) { userConditions.push("email = ?");   userValues.push(data.personal_details.personal_email); }

  if (userConditions.length > 0) {
    const [[dupUser]] = await pool.query(
      `SELECT id FROM users WHERE (${userConditions.join(" OR ")}) AND id != ? LIMIT 1`,
      [...userValues, staff.user_id]
    );
    if (dupUser) {
      throw ApiError.conflict("Another user with this user_id or email already exists.");
    }
  }

  // ---- staff: personal_details.staff_uid -------------------------------------
  if (data.personal_details?.staff_uid) {
    const [[dupUid]] = await pool.query(
      `SELECT id FROM staff WHERE staff_uid = ? AND id != ? LIMIT 1`,
      [data.personal_details.staff_uid, id]
    );
    if (dupUid) {
      throw ApiError.conflict("Another staff member with this Staff ID already exists.");
    }
  }

  // ---- staff_employment_details: work_email ----------------------------------
  if (data.employment_details?.work_email) {
    const [[dupWorkEmail]] = await pool.query(
      `SELECT id FROM staff_employment_details WHERE work_email = ? AND staff_id != ? LIMIT 1`,
      [data.employment_details.work_email, id]
    );
    if (dupWorkEmail) {
      throw ApiError.conflict("Another staff member with this work email already exists.");
    }
  }

  // ---- staff_other_details: aadhar_no ----------------------------------------
  if (data.other_details?.aadhar_no) {
    const [[dupAadhar]] = await pool.query(
      `SELECT id FROM staff_other_details WHERE aadhar_no = ? AND staff_id != ? LIMIT 1`,
      [data.other_details.aadhar_no, id]
    );
    if (dupAadhar) {
      throw ApiError.conflict("Another staff member with this Aadhaar number already exists.");
    }
  }

  // ---- staff_other_details: pan_no -------------------------------------------
  if (data.other_details?.pan_no) {
    const [[dupPan]] = await pool.query(
      `SELECT id FROM staff_other_details WHERE pan_no = ? AND staff_id != ? LIMIT 1`,
      [data.other_details.pan_no, id]
    );
    if (dupPan) {
      throw ApiError.conflict("Another staff member with this PAN number already exists.");
    }
  }

  // ---- staff_addresses: duplicate address_type within the payload itself ----
  if (Array.isArray(data.address)) {
    const types = data.address.map((a) => a.address_type);
    if (new Set(types).size !== types.length) {
      throw ApiError.badRequest("Duplicate address_type values in payload.");
    }
  }

  try {
    await updateStaff(id, data);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound("Staff member not found.");
    }
    if (err.code === "ER_DUP_ENTRY") {
      throw ApiError.conflict(
        "Duplicate entry detected. Check user_id, email, staff_uid, work email, Aadhaar, PAN, or address type."
      );
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw ApiError.badRequest("Invalid reference value. Check employment_place or university_id.");
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Staff member updated successfully."));
});

// =============================================================================
// PATCH /api/staff/bulk
//
// Applies the same field values (status, employment_place) to every staff
// id in the request. A null value for any field means "leave it untouched".
// =============================================================================
const bulkUpdate = asyncHandler(async (req, res) => {
  const { staff_ids } = req.validatedBody;

  let result;
  try {
    result = await bulkUpdateStaffFields(staff_ids, req.validatedBody);
  } catch (err) {
    if (err.code === "ER_NOT_FOUND") {
      throw ApiError.notFound(err.message);
    }
    if (err.code === "ER_NO_FIELDS") {
      throw ApiError.badRequest(err.message);
    }
    throw err;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, `${result.updated_count} staff updated successfully.`));
});

module.exports = {
  create,
  getById,
  getAll,
  getStaffList: getStaffListHandler,

  // single PATCH handler
  patchStaff,
  bulkUpdate
};