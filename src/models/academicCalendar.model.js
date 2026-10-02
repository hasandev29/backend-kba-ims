// src/models/academicCalendar.model.js
"use strict";

const { pool } = require("../config/db");

// =============================================================================
// createAcademicCalendar
// =============================================================================
const createAcademicCalendar = async (data) => {
  const {
    calendar_date,
    event_type,
    affects_attendance,
    applies_to_all_classrooms,
    classroom_ids,
    color_id,
    title,
    description,
    created_by,
  } = data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO academic_calendar
         (calendar_date, event_type, affects_attendance, applies_to_all_classrooms,
          color_id, title, description, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        calendar_date,
        event_type,
        affects_attendance ?? 0,
        applies_to_all_classrooms ?? 1,
        color_id ?? null,
        title,
        description ?? null,
        created_by ?? null,
        created_by ?? null,
      ]
    );

    const entryId = result.insertId;

    if (applies_to_all_classrooms === false && Array.isArray(classroom_ids) && classroom_ids.length > 0) {
      const rows = classroom_ids.map((classroomId) => [entryId, classroomId]);
      await conn.query(
        `INSERT INTO academic_calendar_classrooms (academic_calendar_id, classroom_id) VALUES ?`,
        [rows]
      );
    }

    await conn.commit();
    return entryId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// =============================================================================
// findAcademicCalendarById
// =============================================================================
const findAcademicCalendarById = async (id) => {
  const [[entry]] = await pool.query(
    `SELECT id, calendar_date, event_type, affects_attendance,
            applies_to_all_classrooms, color_id, title, description,
            created_by, updated_by, created_at, updated_at
     FROM academic_calendar
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  if (!entry) return entry;

  const [classroomRows] = await pool.query(
    `SELECT classroom_id
     FROM academic_calendar_classrooms
     WHERE academic_calendar_id = ?
     ORDER BY classroom_id`,
    [id]
  );

  return {
    ...entry,
    affects_attendance: !!entry.affects_attendance,
    applies_to_all_classrooms: !!entry.applies_to_all_classrooms,
    classroom_ids: classroomRows.map((row) => row.classroom_id),
  };
};

// =============================================================================
// Shared WHERE-clause builder
// =============================================================================
const buildFilterClause = ({
  classroom_id,
  applies_to_all_classrooms,
  event_type,
  affects_attendance,
  color_id,
  date_from,
  date_to,
  search,
}) => {
  let clause = " WHERE 1=1";
  const values = [];

  if (event_type !== undefined) { clause += " AND ac.event_type = ?"; values.push(event_type); }
  if (affects_attendance !== undefined) { clause += " AND ac.affects_attendance = ?"; values.push(affects_attendance); }
  if (applies_to_all_classrooms !== undefined) { clause += " AND ac.applies_to_all_classrooms = ?"; values.push(applies_to_all_classrooms); }
  if (color_id !== undefined) { clause += " AND ac.color_id = ?"; values.push(color_id); }

  if (date_from !== undefined) { clause += " AND ac.calendar_date >= ?"; values.push(date_from); }
  if (date_to !== undefined) { clause += " AND ac.calendar_date <= ?"; values.push(date_to); }

  if (classroom_id !== undefined) {
    clause += ` AND (
      ac.applies_to_all_classrooms = 1
      OR EXISTS (
        SELECT 1 FROM academic_calendar_classrooms acc
        WHERE acc.academic_calendar_id = ac.id
          AND acc.classroom_id = ?
      )
    )`;
    values.push(classroom_id);
  }

  if (search) {
    clause += " AND ac.title LIKE ?";
    values.push(`%${search}%`);
  }

  return { clause, values };
};

// =============================================================================
// getAllAcademicCalendar
// =============================================================================
const getAllAcademicCalendar = async (opts) => {
  const { limit, offset } = opts;
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT ac.id, ac.calendar_date, ac.event_type, ac.affects_attendance,
           ac.applies_to_all_classrooms, ac.color_id, ac.title, ac.description,
           ac.created_by, ac.updated_by, ac.created_at, ac.updated_at,
           (
             SELECT GROUP_CONCAT(acc.classroom_id ORDER BY acc.classroom_id)
             FROM academic_calendar_classrooms acc
             WHERE acc.academic_calendar_id = ac.id
           ) AS classroom_ids_raw
    FROM academic_calendar ac
    ${clause}
    ORDER BY ac.calendar_date ASC, ac.id ASC
  `;

  const params = [...values];

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);

  return rows.map(({ classroom_ids_raw, ...row }) => ({
    ...row,
    affects_attendance: !!row.affects_attendance,
    applies_to_all_classrooms: !!row.applies_to_all_classrooms,
    classroom_ids: classroom_ids_raw ? classroom_ids_raw.split(",").map(Number) : [],
  }));
};

// =============================================================================
// countAllAcademicCalendar
// =============================================================================
const countAllAcademicCalendar = async (opts) => {
  const { clause, values } = buildFilterClause(opts);

  const sql = `SELECT COUNT(*) AS total FROM academic_calendar ac ${clause}`;
  const [[{ total }]] = await pool.query(sql, values);
  return total;
};

// =============================================================================
// updateAcademicCalendar
// =============================================================================
const UPDATABLE_FIELDS = [
  "calendar_date",
  "event_type",
  "affects_attendance",
  "applies_to_all_classrooms",
  "color_id",
  "title",
  "description",
];

const updateAcademicCalendar = async (id, data) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

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

    if (setClauses.length > 0) {
      await conn.query(
        `UPDATE academic_calendar SET ${setClauses.join(", ")} WHERE id = ?`,
        [...values, id]
      );
    }

    const touchesClassroomScope =
      Object.prototype.hasOwnProperty.call(data, "applies_to_all_classrooms") ||
      Object.prototype.hasOwnProperty.call(data, "classroom_ids");

    if (touchesClassroomScope) {
      await conn.query(
        `DELETE FROM academic_calendar_classrooms WHERE academic_calendar_id = ?`,
        [id]
      );

      if (
        data.applies_to_all_classrooms === false &&
        Array.isArray(data.classroom_ids) &&
        data.classroom_ids.length > 0
      ) {
        const rows = data.classroom_ids.map((classroomId) => [id, classroomId]);
        await conn.query(
          `INSERT INTO academic_calendar_classrooms (academic_calendar_id, classroom_id) VALUES ?`,
          [rows]
        );
      }
    }

    await conn.commit();
    return setClauses.length > 0 || touchesClassroomScope;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  createAcademicCalendar,
  findAcademicCalendarById,
  getAllAcademicCalendar,
  countAllAcademicCalendar,
  updateAcademicCalendar,
};