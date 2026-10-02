// src/models/timetable.model.js

// =============================================================================
// timetable.model.js
//
// DB operations for the timetables table + its timetable_slots children.
//
// A timetable's slots are NOT a separate top-level resource — they're
// written and read as part of the timetable itself:
//   - createTimetable()  optionally writes an initial set of slots (can be
//     empty — a timetable can be created as an empty grid and filled in
//     one cell at a time afterwards, matching the "+" UI).
//   - updateTimetable()  treats `slots` as an UPSERT keyed by
//     (day_id, period_id) — add or edit a cell — and `remove_slot_ids` as
//     explicit cell-clearing. This is deliberately NOT a full replace like
//     timetable_formats' days/periods, since a real timetable is filled in
//     incrementally rather than redefined wholesale.
//   - findTimetableById() returns the full grid: header + format.days +
//     format.periods + slots (joined with subject/staff names), so the
//     frontend can render either the empty grid or the filled grid from
//     the same response shape.
//
// FK / business-rule checks (classroom_id, format_id, and per-slot
// day_id/period_id/subject_id/staff_id validity) are handled in the
// controller before calling these functions, so the model trusts the
// data it receives.
//
// Exports: createTimetable | findTimetableById | getAllTimetables |
//          countAllTimetables | updateTimetable | bulkUpdateTimetableStatus
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// -----------------------------------------------------------------------------
// Shared slot-row mapper (create + update use the same column order)
// -----------------------------------------------------------------------------
const toSlotRow = (timetableId, s) => [
  timetableId,
  s.day_id,
  s.period_id,
  s.subject_id ?? null,
  s.staff_id,
  s.remarks ?? null,
];

// =============================================================================
// createTimetable
// =============================================================================
const createTimetable = async (data) => {
  const {
    timetable_name,
    classroom_id,
    academic_term_id,
    format_id,
    effective_from,
    effective_to,
    notes,
    is_active,
    created_by,
    slots,
  } = data;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO timetables
         (timetable_name, classroom_id, academic_term_id, format_id, effective_from, effective_to, notes, is_active, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timetable_name,
        classroom_id,
        academic_term_id,
        format_id,
        effective_from,
        effective_to ?? null,
        notes ?? null,
        is_active ?? 1,
        created_by ?? null,
        created_by ?? null,
      ]
    );
    const timetableId = result.insertId;

    if (slots?.length) {
      const slotRows = slots.map((s) => toSlotRow(timetableId, s));
      await connection.query(
        `INSERT INTO timetable_slots (timetable_id, day_id, period_id, subject_id, staff_id, remarks)
         VALUES ?`,
        [slotRows]
      );
    }

    await connection.commit();
    return timetableId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findTimetableById
// Returns the header row plus the full grid: format.days, format.periods,
// and the slots that have been filled in so far (with subject/staff names
// joined in for display).
// =============================================================================
const findTimetableById = async (id) => {
  const [[timetable]] = await pool.query(
    `SELECT id, timetable_name, classroom_id, academic_term_id, format_id, effective_from, effective_to,
            notes, is_active, version, created_by, updated_by, created_at, updated_at
     FROM timetables
     WHERE id = ?
     LIMIT 1`,
    [id]
  );  if (!timetable) return undefined;

  const [[format]] = await pool.query(
    `SELECT id, format_name FROM timetable_formats WHERE id = ? LIMIT 1`,
    [timetable.format_id]
  );

  const [days] = await pool.query(
    `SELECT id, day_order, day_name
     FROM timetable_format_days
     WHERE format_id = ?
     ORDER BY day_order ASC`,
    [timetable.format_id]
  );

  const [periods] = await pool.query(
    `SELECT id, period_order, period_key, period_label, start_time, end_time, is_break, is_lunch
     FROM timetable_format_periods
     WHERE format_id = ?
     ORDER BY period_order ASC`,
    [timetable.format_id]
  );

const [slots] = await pool.query(
`SELECT ts.id, ts.day_id, ts.period_id, ts.subject_id, sub.name AS subject_name, sub.code AS subject_code,
            ts.staff_id, st.name AS staff_name, ts.remarks
     FROM timetable_slots ts
     LEFT JOIN subjects sub ON sub.id = ts.subject_id
     LEFT JOIN staff st     ON st.id  = ts.staff_id
     WHERE ts.timetable_id = ?`,
    [id]
  );

  return {
    ...timetable,
    format: format ? { ...format, days, periods } : null,
    slots,
  };
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// (kept private — used by both getAllTimetables and countAllTimetables so
// the two queries can never drift apart)
// =============================================================================
const buildFilterClause = ({
  classroom_id,
  academic_term_id,
  format_id,
  is_active,
  effective_from,
  effective_to,
  effective_month, // 1-12
  effective_year,  // e.g. 2025
  search,
}) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (classroom_id     !== undefined) { clause += " AND classroom_id = ?";     values.push(classroom_id);     }
  if (academic_term_id !== undefined) { clause += " AND academic_term_id = ?"; values.push(academic_term_id); }
  if (format_id        !== undefined) { clause += " AND format_id = ?";        values.push(format_id);        }
  if (is_active    !== undefined) { clause += " AND is_active = ?";    values.push(is_active);    }

  // effective_from / effective_to act as a simple range filter on those columns
  if (effective_from !== undefined) { clause += " AND effective_from >= ?"; values.push(effective_from); }
  if (effective_to   !== undefined) { clause += " AND (effective_to IS NULL OR effective_to <= ?)"; values.push(effective_to); }

  // effective_period (MM-YYYY) — match timetables whose effective_from OR
  // effective_to falls in that month/year.
  if (effective_month !== undefined && effective_year !== undefined) {
    clause += ` AND (
      (MONTH(effective_from) = ? AND YEAR(effective_from) = ?)
      OR (effective_to IS NOT NULL AND MONTH(effective_to) = ? AND YEAR(effective_to) = ?)
    )`;
    values.push(effective_month, effective_year, effective_month, effective_year);
  }

  if (search) {
    clause += " AND timetable_name LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllTimetables
// Supports filters: classroom_id, format_id, is_active, effective_from,
// effective_to, plus `search` on timetable_name. Paginated. Returns header
// rows only — use findTimetableById for the full grid of a single timetable.
// =============================================================================
const getAllTimetables = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, timetable_name, classroom_id, academic_term_id, format_id, effective_from, effective_to,
           notes, is_active, version, created_by, updated_by, created_at, updated_at
    FROM timetables
    ${clause}
    ORDER BY id DESC
  `;

  const params = [...values];

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};

// =============================================================================
// countAllTimetables (for pagination meta)
// =============================================================================
const countAllTimetables = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM timetables ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateTimetable
// - Header fields: partial update, only columns present in `data` change.
// - data.slots (if present): UPSERT keyed by (timetable_id, day_id, period_id)
//   — add a new cell or edit an existing one's subject/staff/remarks.
// - data.remove_slot_ids (if present): delete those specific slot rows.
// =============================================================================
const UPDATABLE_FIELDS = [
  "timetable_name", "classroom_id", "academic_term_id", "format_id",
  "effective_from", "effective_to", "notes", "is_active",
];

const updateTimetable = async (id, data) => {
  const setClauses = [];
  const values = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  if (Object.prototype.hasOwnProperty.call(data, "updated_by")) {
    setClauses.push("updated_by = ?");
    values.push(data.updated_by ?? null);
  }

  const hasHeaderChanges = setClauses.length > 0;
  const hasSlotUpserts = Array.isArray(data.slots) && data.slots.length > 0;
  const hasSlotRemovals = Array.isArray(data.remove_slot_ids) && data.remove_slot_ids.length > 0;

  if (!hasHeaderChanges && !hasSlotUpserts && !hasSlotRemovals) return false;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Slots are part of the timetable resource, so ANY change to this
    // timetable (header or slots) bumps `version` and is guarded by an
    // optimistic-lock check against the version the client last read.
    // A 0-row result means someone else updated this timetable first.
    setClauses.push("version = version + 1");
    const [headerResult] = await connection.query(
      `UPDATE timetables SET ${setClauses.join(", ")} WHERE id = ? AND version = ?`,
      [...values, id, data.version]
    );

    if (headerResult.affectedRows === 0) {
      const err = new Error(
        `Version conflict: timetable ${id} was modified by another request. Refetch and retry.`
      );
      err.code = "ER_VERSION_CONFLICT";
      throw err;
    }

    if (hasSlotUpserts) {
      const slotRows = data.slots.map((s) => toSlotRow(id, s));
      await connection.query(
        `INSERT INTO timetable_slots (timetable_id, day_id, period_id, subject_id, staff_id, remarks)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           subject_id = VALUES(subject_id),
           staff_id   = VALUES(staff_id),
           remarks    = VALUES(remarks)`,
        [slotRows]
      );
    }

    if (hasSlotRemovals) {
      await connection.query(
        `DELETE FROM timetable_slots WHERE timetable_id = ? AND id IN (?)`,
        [id, data.remove_slot_ids]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
// =============================================================================
// bulkUpdateTimetableStatus
// =============================================================================
const bulkUpdateTimetableStatus = async (ids, isActive, updatedBy) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update against a wrong id would be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM timetables WHERE id IN (?) FOR UPDATE`,
      [ids]
    );
    if (existingRows.length !== ids.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      const err = new Error(`Timetable id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `UPDATE timetables SET is_active = ?, updated_by = ?, version = version + 1 WHERE id IN (?)`,
      [isActive, updatedBy ?? null, ids]
    );

    await connection.commit();
    return { updated_count: ids.length, ids };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createTimetable,
  findTimetableById,
  getAllTimetables,
  countAllTimetables,
  updateTimetable,
  bulkUpdateTimetableStatus,
};