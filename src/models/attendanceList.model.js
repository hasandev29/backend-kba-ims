// src/models/attendanceList.model.js

// =============================================================================
// attendanceList.model.js
//
// Read-only queries behind the attendance LIST views.
//
// Date view pipeline (each step is one function below):
//   1. getDateViewSessions()           candidate sessions (regular + additional)
//                                      + attendance session + derived status,
//                                      filtered, ordered and paginated in SQL
//   2. getDateViewGroupTotals()        per-group totals over the FILTERED set
//                                      (also gives the overall total for paging)
//   3. getAttendanceCountsBySessionIds()  per-status record counts for the
//                                      completed sessions on the current page
//
// Holiday resolution now lives in academicCalendar.model.js — the controller
// calls getAllAcademicCalendar() with date_from = date_to = the requested
// date and affects_attendance: 1, then passes the result in here as
// `fullHoliday` (whole college) / `holidayClassroomIds` (specific classrooms).
//
// "Candidate session" = a class that is expected to happen on the date:
//   - regular  : a timetable slot whose day matches the requested day name
//   - makeup / extra : an additional_classes row on the requested date
//
// Derived status (never stored):
//   no attendance session                        -> pending
//   attendance session = draft                    -> pending
//   attendance session = completed                -> completed
//   attendance session = cancelled                -> cancelled
//   (extra rule) additional class itself cancelled
//   and no completed attendance                   -> cancelled
//   regular class falling on a holiday            -> holiday (overrides pending)
//
// Exports: getDateViewSessions | getDateViewGroupTotals |
//          getAttendanceCountsBySessionIds
// =============================================================================

"use strict";

const { pool } = require("../config/db");

// -----------------------------------------------------------------------------
// Column names that were NOT in the SQL you shared (classrooms, subjects,
// staff, timetable_format_days, timetable_format_periods). If any differ in
// your DB, change them here — this is the only place they are referenced.
// -----------------------------------------------------------------------------
const COL = {
  classroomName: "name",     // classrooms.name
  subjectName: "name",       // subjects.name
  staffName: "name",         // staff.name
  dayName: "day_name",       // timetable_format_days.day_name   (ENUM, uppercase e.g. "FRIDAY")
  periodLabel: "period_label", // timetable_format_periods.period_label (e.g. "Period 1")
  periodOrder: "period_order", // timetable_format_periods.period_order
  periodStart: "start_time", // timetable_format_periods.start_time
  periodEnd: "end_time",     // timetable_format_periods.end_time
  termName: "name",          // academic_terms.name
};

// =============================================================================
// Candidate + status query (private).
//
// Regular AND additional classes are always included as candidates now — a
// holiday no longer removes rows from the result set. Instead, `fullHoliday`
// (whole-college holiday) and `holidayClassroomIds` (classroom-specific
// holiday) feed into the status CASE below, so a regular class on a holiday
// comes back with status 'holiday' instead of 'pending'. Additional
// (makeup / extra) classes are deliberately scheduled classes, so they keep
// their normal derived status even on a holiday date.
//
// Each UNION part LEFT JOINs its own attendance session, so the join uses a
// plain index lookup:
//   regular    -> uq_as_date_slot        (attendance_date, timetable_slot_id)
//   additional -> uq_as_additional_class (additional_class_id)
//
// Both UNION parts must select the same columns in the same order.
// =============================================================================
// Checked in this order when a date has more than one attendance-affecting
// event type (e.g. a HOLIDAY and an EXAM both covering the same classroom) —
// first match in this list wins.
const EVENT_STATUS_PRIORITY = ["HOLIDAY", "EXAM", "EVENT"];

const buildCoverageCondition = (coverage) => {
  if (coverage.full) return { condition: "1=1", params: [] };
  if (coverage.classroomIds.length) {
    return { condition: "cand.classroom_id IN (?)", params: [coverage.classroomIds] };
  }
  return { condition: "1=0", params: [] };
};

const buildBaseSql = ({
  academic_term_id,
  date,
  day,
  coverageByType,
}) => {
  const parts = [];
  const partsParams = [];

  // ---- regular classes from the timetable ---------------------------------
  parts.push(`
      SELECT
        CONCAT('slot-', ts.id)        AS source_key,
        'regular'                     AS session_type,
        ts.id                         AS timetable_slot_id,
        NULL                          AS additional_class_id,
        t.classroom_id                AS classroom_id,
        ts.subject_id                 AS subject_id,
        ts.staff_id                   AS staff_id,
        ts.period_id                  AS period_id,
        p.${COL.periodLabel}          AS period_label,
        p.${COL.periodOrder}          AS period_order,
        p.${COL.periodStart}          AS start_time,
        p.${COL.periodEnd}            AS end_time,
        NULL                          AS class_status,
        a.id                          AS attendance_session_id,
        a.session_status              AS attendance_session_status
      FROM timetables t
      JOIN timetable_slots ts           ON ts.timetable_id = t.id
      JOIN timetable_format_days d      ON d.id = ts.day_id
      JOIN timetable_format_periods p   ON p.id = ts.period_id
      LEFT JOIN attendance_sessions a   ON a.timetable_slot_id = ts.id
                                       AND a.attendance_date = ?
      WHERE t.academic_term_id = ?
        AND t.is_active = 1
        AND t.effective_from <= ?
        AND (t.effective_to IS NULL OR t.effective_to >= ?)
        AND d.${COL.dayName} = ?
        AND ts.subject_id IS NOT NULL`);
  partsParams.push(date, academic_term_id, date, date, day.toUpperCase());

  // ---- additional (makeup / extra) classes --------------------------------
  parts.push(`
      SELECT
        CONCAT('additional-', ac.id)  AS source_key,
        ac.class_type                 AS session_type,
        NULL                          AS timetable_slot_id,
        ac.id                         AS additional_class_id,
        ac.classroom_id               AS classroom_id,
        ac.subject_id                 AS subject_id,
        ac.staff_id                   AS staff_id,
        NULL                          AS period_id,
        NULL                          AS period_label,
        NULL                          AS period_order,
        ac.start_time                 AS start_time,
        ac.end_time                   AS end_time,
        ac.status                     AS class_status,
        a.id                          AS attendance_session_id,
        a.session_status              AS attendance_session_status
      FROM additional_classes ac
      LEFT JOIN attendance_sessions a ON a.additional_class_id = ac.id
      WHERE ac.academic_term_id = ?
        AND ac.class_date = ?`);
  partsParams.push(academic_term_id, date);

  // Calendar branches of the status CASE below, one per event type, checked
  // in EVENT_STATUS_PRIORITY order. Only 'regular' candidates are ever
  // overridden — makeup/extra classes keep their normal derived status even
  // on a holiday/event/exam date.
  const calendarParams = [];
  const calendarWhenClauses = EVENT_STATUS_PRIORITY.map((type) => {
    const { condition, params } = buildCoverageCondition(
      coverageByType[type] ?? { full: false, classroomIds: [] }
    );
    calendarParams.push(...params);
    return `WHEN cand.session_type = 'regular' AND (${condition}) THEN '${type.toLowerCase()}'`;
  }).join("\n        ");

  // NOTE: this CASE lives in the outer SELECT list, which appears in the SQL
  // text BEFORE the subquery in FROM (${parts...}) — so calendarParams must
  // be bound before partsParams below, not after.
  const sql = `
    SELECT
      cand.*,
      cr.${COL.classroomName} AS classroom_name,
      sb.${COL.subjectName}   AS subject_name,
      COALESCE(sf.${COL.staffName}, sf.short_name, sf.staff_uid) AS staff_name,
      CASE
        WHEN cand.attendance_session_status = 'completed' THEN 'completed'
        WHEN cand.attendance_session_status = 'cancelled'
          OR cand.class_status = 'cancelled'              THEN 'cancelled'
        ${calendarWhenClauses}
        ELSE 'pending'
      END AS status
    FROM (${parts.join("\n UNION ALL \n")}) cand
    JOIN classrooms cr ON cr.id = cand.classroom_id
    JOIN subjects   sb ON sb.id = cand.subject_id
    JOIN staff      sf ON sf.id = cand.staff_id`;

  return { sql, params: [...calendarParams, ...partsParams] };
};

// -----------------------------------------------------------------------------
// Filters applied on top of the derived rows (`x` = the base query).
// Status has to be filtered here because it is a computed column.
// -----------------------------------------------------------------------------
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

const buildFilterClause = ({
  classroom_id,
  staff_id,
  session_type,
  session_status,
  search,
}) => {
  const conditions = [];
  const values = [];

  if (classroom_id !== undefined) {
    conditions.push("x.classroom_id = ?");
    values.push(classroom_id);
  }
  if (staff_id !== undefined) {
    conditions.push("x.staff_id = ?");
    values.push(staff_id);
  }
  if (session_type !== undefined) {
    conditions.push("x.session_type = ?");
    values.push(session_type);
  }
  if (session_status !== undefined) {
    conditions.push("x.status = ?");
    values.push(session_status);
  }
  if (search) {
    const like = `%${escapeLike(search)}%`;
    conditions.push(
      `(x.classroom_name LIKE ?
        OR x.subject_name LIKE ?
        OR x.staff_name LIKE ?
        OR x.period_label LIKE ?)`
    );
    values.push(like, like, like, like);
  }

  return {
    clause: conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

// Rows are ordered by the group key first so that pagination slices the list
// group by group (a group only ever splits at a page boundary).
const ORDER_BY = {
  classroom: `x.classroom_name ASC, x.classroom_id ASC,
              x.start_time ASC, x.source_key ASC`,
  staff: `x.staff_name ASC, x.staff_id ASC,
          x.start_time ASC, x.source_key ASC`,
  status: `FIELD(x.status, 'pending', 'holiday', 'completed', 'cancelled') ASC,
           x.classroom_name ASC, x.classroom_id ASC,
           x.start_time ASC, x.source_key ASC`,
};

// =============================================================================
// 2. One page of session rows
// =============================================================================
const getDateViewSessions = async (opts) => {
  const { group_by, limit, offset } = opts;
  const base = buildBaseSql(opts);
  const { clause, values } = buildFilterClause(opts);

  let sql = `
    SELECT x.*
    FROM (${base.sql}) x
    ${clause}
    ORDER BY ${ORDER_BY[group_by]}`;

  const params = [...base.params, ...values];

  if (limit != null) {
    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};

// =============================================================================
// 3. Totals per group over the whole filtered set (not just this page).
//    Returns [{ group_key, session_count }] — group_key is classroom_id or
//    status depending on group_by. The sum of session_count is the overall
//    total used for pagination.
// =============================================================================
const getDateViewGroupTotals = async (opts) => {
  const groupExpr = {
    classroom: "x.classroom_id",
    staff: "x.staff_id",
    status: "x.status",
  }[opts.group_by];
  const base = buildBaseSql(opts);
  const { clause, values } = buildFilterClause(opts);

  const sql = `
    SELECT ${groupExpr} AS group_key, COUNT(*) AS session_count
    FROM (${base.sql}) x
    ${clause}
    GROUP BY ${groupExpr}`;

  const [rows] = await pool.query(sql, [...base.params, ...values]);
  return rows;
};

// =============================================================================
// 4. Record counts per attendance status for the given attendance sessions.
//    Returns [{ session_id, attendance_status, cnt }].
// =============================================================================
const getAttendanceCountsBySessionIds = async (sessionIds) => {
  if (!sessionIds.length) return [];

  const [rows] = await pool.query(
    `SELECT session_id, attendance_status, COUNT(*) AS cnt
     FROM attendance_records
     WHERE session_id IN (?)
     GROUP BY session_id, attendance_status`,
    [sessionIds]
  );
  return rows;
};

// =============================================================================
// 5. Single period (timetable slot) details for a date.
//    Returns one row or undefined. Attendance session is LEFT JOINed on
//    (timetable_slot_id, attendance_date) -> uq_as_date_slot.
// =============================================================================
const getSlotDetailById = async (timetable_slot_id, date) => {
  const [rows] = await pool.query(
    `SELECT
       ts.id                              AS timetable_slot_id,
       t.academic_term_id                 AS academic_term_id,
       at.${COL.termName}                 AS academic_term_name,
       d.${COL.dayName}                   AS slot_day_name,
       t.classroom_id                     AS classroom_id,
       cr.${COL.classroomName}            AS classroom_name,
       ts.subject_id                      AS subject_id,
       sb.${COL.subjectName}              AS subject_name,
       ts.staff_id                        AS staff_id,
       COALESCE(sf.${COL.staffName}, sf.short_name, sf.staff_uid) AS staff_name,
       ts.period_id                       AS period_id,
       p.${COL.periodLabel}               AS period_label,
       p.${COL.periodOrder}               AS period_order,
       p.${COL.periodStart}               AS start_time,
       p.${COL.periodEnd}                 AS end_time,
       TIMESTAMPDIFF(MINUTE, p.${COL.periodStart}, p.${COL.periodEnd}) AS duration_minutes,
       a.id                               AS attendance_session_id,
       a.session_status                   AS attendance_session_status,
       a.remarks                          AS remarks
     FROM timetable_slots ts
     JOIN timetables t                 ON t.id = ts.timetable_id
     JOIN academic_terms at            ON at.id = t.academic_term_id
     JOIN timetable_format_days d      ON d.id = ts.day_id
     JOIN timetable_format_periods p   ON p.id = ts.period_id
     JOIN classrooms cr                ON cr.id = t.classroom_id
     LEFT JOIN subjects sb             ON sb.id = ts.subject_id
     LEFT JOIN staff sf                ON sf.id = ts.staff_id
     LEFT JOIN attendance_sessions a   ON a.timetable_slot_id = ts.id
                                      AND a.attendance_date = ?
     WHERE ts.id = ?
     LIMIT 1`,
    [date, timetable_slot_id]
  );
  return rows[0];
};

module.exports = {
  getSlotDetailById,
  getDateViewSessions,
  getDateViewGroupTotals,
  getAttendanceCountsBySessionIds,
};