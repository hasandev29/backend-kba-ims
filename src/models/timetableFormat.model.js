// src/models/timetableFormat.model.js

// =============================================================================
// timetableFormat.model.js
//
// DB operations for timetable_formats + its child tables
// (timetable_format_days, timetable_format_periods).
//
// A "format" is written as one unit: the header row plus its full set of
// days and periods. On create() and on update() (when days/periods are
// supplied) the children are fully replaced inside a transaction, so the
// format can never end up half-written or with stale rows from a previous
// version.
//
// Business-rule checks (duplicate day/period order, etc.) are enforced by
// the UNIQUE constraints in SQL; the controller translates ER_DUP_ENTRY
// into a friendly 422.
//
// Exports: createTimetableFormat | findTimetableFormatById |
//          getAllTimetableFormats | countAllTimetableFormats |
//          updateTimetableFormat | bulkUpdateTimetableFormatStatus
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createTimetableFormat
// =============================================================================
const createTimetableFormat = async (data) => {
  const { format_name, description, course, is_active, days, periods } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO timetable_formats (format_name, description, course, is_active)
       VALUES (?, ?, ?, ?)`,
      [format_name, description ?? null, course, is_active ?? 1]
    );
    const formatId = result.insertId;

    if (days?.length) {
      const dayRows = days.map((d) => [formatId, d.day_order, d.day_name]);
      await connection.query(
        `INSERT INTO timetable_format_days (format_id, day_order, day_name) VALUES ?`,
        [dayRows]
      );
    }

    if (periods?.length) {
      const periodRows = periods.map((p) => [
        formatId,
        p.period_order,
        p.period_key,
        p.period_label,
        p.start_time ?? null,
        p.end_time ?? null,
        p.is_break ?? 0,
        p.is_lunch ?? 0,
      ]);
      await connection.query(
        `INSERT INTO timetable_format_periods
           (format_id, period_order, period_key, period_label, start_time, end_time, is_break, is_lunch)
         VALUES ?`,
        [periodRows]
      );
    }

    await connection.commit();
    return formatId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// =============================================================================
// findTimetableFormatById
// Returns the format row with its days & periods nested, ordered for display.
// =============================================================================
const findTimetableFormatById = async (id) => {
  const [[format]] = await pool.query(
    `SELECT id, format_name, description, course, is_active, created_at, updated_at
     FROM timetable_formats
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  if (!format) return undefined;

  const [days] = await pool.query(
    `SELECT id, day_order, day_name
     FROM timetable_format_days
     WHERE format_id = ?
     ORDER BY day_order ASC`,
    [id]
  );

  const [periods] = await pool.query(
    `SELECT id, period_order, period_key, period_label, start_time, end_time, is_break, is_lunch
     FROM timetable_format_periods
     WHERE format_id = ?
     ORDER BY period_order ASC`,
    [id]
  );

  return { ...format, days, periods };
};

// =============================================================================
// Shared WHERE-clause builder for filters + search
// (kept private — used by both getAllTimetableFormats and
// countAllTimetableFormats so the two queries can never drift apart)
// =============================================================================
const buildFilterClause = ({ is_active, search }) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (is_active !== undefined) {
    clause += " AND is_active = ?";
    values.push(is_active);
  }

  if (search) {
    clause += " AND (format_name LIKE ? OR description LIKE ?)";
    const like = `%${search}%`;
    values.push(like, like);
  }

  return { clause, values };
};

// =============================================================================
// getAllTimetableFormats
// Supports filters: is_active, plus `search` across format_name & description.
// Paginated. Returns header rows only (no nested days/periods) — use
// findTimetableFormatById for the full structure of a single format.
// =============================================================================
const getAllTimetableFormats = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT id, format_name, description, course, is_active, created_at, updated_at
    FROM timetable_formats
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
// countAllTimetableFormats (for pagination meta)
// =============================================================================
const countAllTimetableFormats = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM timetable_formats ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateTimetableFormat
// Partial update on the header row — only columns present in `data` are
// changed. If `days` and/or `periods` arrays are present, that child set is
// fully replaced (delete + re-insert) inside the same transaction.
// =============================================================================
const UPDATABLE_FIELDS = ["format_name", "description", "course", "is_active"];

const updateTimetableFormat = async (id, data) => {
  const setClauses = [];
  const values = [];

  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = ?`);
      values.push(data[field] ?? null);
    }
  });

  const hasHeaderChanges = setClauses.length > 0;
  const hasDays = Array.isArray(data.days);
  const hasPeriods = Array.isArray(data.periods);

  if (!hasHeaderChanges && !hasDays && !hasPeriods) return false;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (hasHeaderChanges) {
      await connection.query(
        `UPDATE timetable_formats SET ${setClauses.join(", ")} WHERE id = ?`,
        [...values, id]
      );
    }

    if (hasDays) {
      await connection.query(`DELETE FROM timetable_format_days WHERE format_id = ?`, [id]);
      if (data.days.length) {
        const dayRows = data.days.map((d) => [id, d.day_order, d.day_name]);
        await connection.query(
          `INSERT INTO timetable_format_days (format_id, day_order, day_name) VALUES ?`,
          [dayRows]
        );
      }
    }

    if (hasPeriods) {
      await connection.query(`DELETE FROM timetable_format_periods WHERE format_id = ?`, [id]);
      if (data.periods.length) {
        const periodRows = data.periods.map((p) => [
          id,
          p.period_order,
          p.period_key,
          p.period_label,
          p.start_time ?? null,
          p.end_time ?? null,
          p.is_break ?? 0,
          p.is_lunch ?? 0,
        ]);
        await connection.query(
          `INSERT INTO timetable_format_periods
             (format_id, period_order, period_key, period_label, start_time, end_time, is_break, is_lunch)
           VALUES ?`,
          [periodRows]
        );
      }
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
// bulkUpdateTimetableFormatStatus
// =============================================================================
const bulkUpdateTimetableFormatStatus = async (ids, isActive) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify every id exists (and lock the rows) before writing anything —
    // a partial bulk update against a wrong id would be silently confusing.
    const [existingRows] = await connection.query(
      `SELECT id FROM timetable_formats WHERE id IN (?) FOR UPDATE`,
      [ids]
    );
    if (existingRows.length !== ids.length) {
      const foundIds = new Set(existingRows.map((r) => r.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      const err = new Error(`Timetable format id(s) not found: ${missing.join(", ")}`);
      err.code = "ER_NOT_FOUND";
      throw err;
    }

    await connection.query(
      `UPDATE timetable_formats SET is_active = ? WHERE id IN (?)`,
      [isActive, ids]
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
  createTimetableFormat,
  findTimetableFormatById,
  getAllTimetableFormats,
  countAllTimetableFormats,
  updateTimetableFormat,
  bulkUpdateTimetableFormatStatus,
};