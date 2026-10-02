// src/controllers/attendanceList.controller.js

// =============================================================================
// attendanceList.controller.js
//
// GET /api/attendances/sessions
//
// Flow:
//   1. Read validated params
//   2. Check academic calendar (holiday / attendance-affecting events)
//        - whole-college holiday      -> skip regular timetable classes
//        - classroom-specific holiday -> skip regular classes of that classroom
//        - additional classes are always fetched
//   3. Model builds regular + additional candidate sessions, joins attendance
//      sessions, derives Pending / Completed / Cancelled, applies classroom /
//      session type / session status / search filters, orders and paginates
//   4. Fetch attendance records for the completed sessions on this page and
//      calculate the attendance count
//   5. Group by classroom or status and return
//
// Exports: getDateView
// =============================================================================

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { resolvePagination } = require("../utils/pagination");
const {
  getSlotDetailById,
  getDateViewSessions,
  getDateViewGroupTotals,
  getAttendanceCountsBySessionIds,
} = require("../models/attendanceList.model");
const { getAllAcademicCalendar } = require("../models/academicCalendar.model");
const { findAdditionalClassById } = require("../models/additionalClass.model");

// Statuses that count towards the "attended" number in "43/60".
// Change here if your college counts them differently.
const ATTENDED_STATUSES = ["present", "od"];

// A single date should never legitimately have more than a handful of
// attendance-affecting calendar entries; this just bounds the query passed
// to getAllAcademicCalendar.
const MAX_CALENDAR_EVENTS_PER_DAY = 200;

const STATUS_LABELS = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  holiday: "Holiday",
  exam: "Exam",
  event: "Event",
};

const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

// -----------------------------------------------------------------------------
// Calendar: which classrooms are covered by which event type on this date?
// getDateView() already fetches only affects_attendance = 1 events for this
// exact date, so every event here already qualifies to override status.
//
// Returns coverageByType = {
//   HOLIDAY: { full, classroomIds },
//   EXAM:    { full, classroomIds },
//   EVENT:   { full, classroomIds },
// }
// full = true  -> at least one event of that type has applies_to_all_classrooms
// classroomIds -> union of classroom_ids across that type's partial-scope
//                 events (irrelevant once full = true)
// -----------------------------------------------------------------------------
const resolveCalendar = (events) => {
  const coverageByType = {
    HOLIDAY: { full: false, classroomIds: [] },
    EXAM: { full: false, classroomIds: [] },
    EVENT: { full: false, classroomIds: [] },
  };

  for (const e of events) {
    const bucket = coverageByType[e.event_type];
    if (!bucket) continue; // unknown event_type — ignore rather than throw

    if (e.applies_to_all_classrooms) {
      bucket.full = true;
    } else {
      bucket.classroomIds.push(...e.classroom_ids);
    }
  }

  for (const bucket of Object.values(coverageByType)) {
    bucket.classroomIds = [...new Set(bucket.classroomIds)];
  }

  return coverageByType;
};

// -----------------------------------------------------------------------------
// Attendance count per completed session, e.g. { attended: 43, total: 60, ... }
// -----------------------------------------------------------------------------
const buildCountsMap = (countRows) => {
  const map = new Map();

  for (const r of countRows) {
    if (!map.has(r.session_id)) {
      map.set(r.session_id, {
        present: 0,
        absent: 0,
        od: 0,
        attended: 0,
        total: 0,
      });
    }
    const c = map.get(r.session_id);
    const n = Number(r.cnt);
    c[r.attendance_status] = n;
    c.total += n;
  }

  for (const c of map.values()) {
    c.attended = ATTENDED_STATUSES.reduce((sum, s) => sum + c[s], 0);
  }
  return map;
};

const EMPTY_COUNTS = {
  present: 0,
  absent: 0,
  od: 0,
  attended: 0,
  total: 0,
};

const toSessionDto = (row, countsMap) => ({
  key: row.source_key, // unique per row — handy as a React key
  session_type: row.session_type, // regular | makeup | extra
  status: row.status, // pending | completed | cancelled
  attendance_session_id: row.attendance_session_id ?? null,
  timetable_slot_id: row.timetable_slot_id ?? null,
  additional_class_id: row.additional_class_id ?? null,
  classroom: { id: row.classroom_id, name: row.classroom_name },
  subject: { id: row.subject_id, name: row.subject_name },
  staff: { id: row.staff_id, name: row.staff_name },
  // additional classes have no timetable period
  period: row.period_id
    ? { id: row.period_id, label: row.period_label, order: row.period_order }
    : null,
  start_time: hhmm(row.start_time),
  end_time: hhmm(row.end_time),
  // only completed sessions carry a count; pending / cancelled -> null ("-")
  attendance:
    row.status === "completed" && row.attendance_session_id
      ? countsMap.get(row.attendance_session_id) ?? { ...EMPTY_COUNTS }
      : null,
});

// -----------------------------------------------------------------------------
// Group the page's sessions. `session_count` is the group's total across ALL
// pages (after filters); `sessions` holds only this page's rows.
// -----------------------------------------------------------------------------
const buildGroups = (sessions, groupBy, totalsMap) => {
  const groups = new Map();

  for (const s of sessions) {
    const key =
      groupBy === "classroom" ? s.classroom.id
      : groupBy === "staff" ? s.staff.id
      : s.status;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label:
          groupBy === "classroom" ? s.classroom.name
          : groupBy === "staff" ? s.staff.name
          : STATUS_LABELS[s.status],
        ...(groupBy === "classroom" ? { classroom_id: key }
          : groupBy === "staff" ? { staff_id: key }
          : { status: key }),
        session_count: totalsMap.get(key) ?? 0,
        sessions: [],
      });
    }
    groups.get(key).sessions.push(s);
  }

  return [...groups.values()];
};

// -----------------------------------------------------------------------------
// GET /api/attendances/sessions
//   ?date=2026-09-11&day=Friday&academic_term_id=3&group_by=classroom|staff|status
//   &classroom_id=&staff_id=&session_type=&session_status=&search=&page=&limit=
// -----------------------------------------------------------------------------

const getDateView = asyncHandler(async (req, res) => {
  const q = req.validatedQuery ?? req.query;

  const { group_by, date, day, session_type, session_status } = q;
  const academic_term_id = Number(q.academic_term_id);

  const problems = {};
  if (!Number.isInteger(academic_term_id) || academic_term_id < 1) {
    problems.academic_term_id = "academic_term_id is required and must be a positive integer.";
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    problems.date = "date is required and must be a YYYY-MM-DD string.";
  }
  if (!day) {
    problems.day = "day is required (e.g. Friday).";
  }
  if (!["classroom", "staff", "status"].includes(group_by)) {
    problems.group_by = 'group_by must be "classroom", "staff" or "status".';
  }
  if (Object.keys(problems).length) {
    throw new ApiError(422, "Invalid query parameters.", problems);
  }
  const classroom_id =
    q.classroom_id !== undefined && q.classroom_id !== "" ? Number(q.classroom_id) : undefined;
  const staff_id =
    q.staff_id !== undefined && q.staff_id !== "" ? Number(q.staff_id) : undefined;
  const search = typeof q.search === "string" ? q.search.trim() : "";

  // Kept intentionally bounded by default (defaultLimit: 25) since this is a
  // single day's grouped session grid, not a plain filtered list. Pass
  // page/limit explicitly if the caller wants a subset; omit both to get
  // every session for the day.
  const { paginate, page, limit, offset } = resolvePagination(q, { defaultLimit: 25 });

  const events = await getAllAcademicCalendar({
    date_from: date,
    date_to: date,
    affects_attendance: 1,
    limit: MAX_CALENDAR_EVENTS_PER_DAY,
    offset: 0,
  });
  const coverageByType = resolveCalendar(events);

  const queryOpts = {
    academic_term_id, date, day, coverageByType, classroom_id, staff_id,
    session_type, session_status, search: search || undefined, group_by,
  };

  const [rows, groupTotals] = await Promise.all([
    getDateViewSessions({ ...queryOpts, limit, offset }),
    getDateViewGroupTotals(queryOpts),
  ]);

  const total = groupTotals.reduce((sum, g) => sum + Number(g.session_count), 0);
  const totalsMap = new Map(groupTotals.map((g) => [g.group_key, Number(g.session_count)]));

  const completedSessionIds = rows
    .filter((r) => r.status === "completed" && r.attendance_session_id)
    .map((r) => r.attendance_session_id);

  const countRows = await getAttendanceCountsBySessionIds(completedSessionIds);
  const countsMap = buildCountsMap(countRows);

  const sessions = rows.map((r) => toSessionDto(r, countsMap));
  const groups = buildGroups(sessions, group_by, totalsMap);

  const meta = paginate
    ? {
        total, page, limit, totalPages: Math.ceil(total / limit),
        from: total ? offset + 1 : 0,
        to: offset + rows.length,
      }
    : { total, from: total ? 1 : 0, to: rows.length };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date, day, group_by,
        calendar: {
          is_holiday: coverageByType.HOLIDAY.full,
          coverage: { holiday: coverageByType.HOLIDAY, exam: coverageByType.EXAM, event: coverageByType.EVENT },
          events: events.map((e) => ({
            id: e.id, title: e.title, description: e.description, event_type: e.event_type,
            affects_attendance: Boolean(e.affects_attendance),
            applies_to_all_classrooms: e.applies_to_all_classrooms,
            classroom_ids: e.classroom_ids,
          })),
        },
        groups,
      },
      "Attendance sessions fetched successfully.",
      meta
    )
  );
});

// -----------------------------------------------------------------------------
// GET /api/attendances/slot/:slot_id?date=2026-09-11&type=regular|extra
// Status: no attendance session -> pending; draft -> pending (same rule as the
// list view); otherwise the stored session_status (completed / cancelled).
// -----------------------------------------------------------------------------
const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// Same rule used everywhere else: no session / draft -> pending,
// completed -> completed, cancelled (session or the class itself) -> cancelled.
const deriveStatus = (sessionStatus, classStatus) => {
  if (sessionStatus === "completed") return "completed";
  if (sessionStatus === "cancelled" || classStatus === "cancelled") return "cancelled";
  return "pending";
};

const minutesBetween = (start, end) => {
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

// -----------------------------------------------------------------------------
// "extra" branch of getSlotDetail — reuses additionalClass.model's
// findAdditionalClassById() and the additional_classes table instead of the
// timetable. The `:slot_id` param is treated as additional_class_id.
// -----------------------------------------------------------------------------
const buildAdditionalClassDetail = async (additionalClassId, date) => {
  const additionalClass = await findAdditionalClassById(additionalClassId);
  if (!additionalClass) throw new ApiError(404, "Additional class not found.");

  if (additionalClass.class_date !== date) {
    throw new ApiError(
      422,
      `This additional class is scheduled on ${additionalClass.class_date}, but ${date} was requested.`
    );
  }

  const session = additionalClass.attendance_session; // { id, session_status, remarks, ... } | null
  const dayName = WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const durationMinutes = minutesBetween(additionalClass.start_time, additionalClass.end_time);

  return {
    timetable_slot_id: null,
    additional_class_id: additionalClass.id,
    attendance_session_id: session?.id ?? null,
    academic_term: { id: additionalClass.academic_term_id, name: additionalClass.academic_term_name },
    attendance_date: date,
    day: dayName,
    classroom: { id: additionalClass.classroom_id, name: additionalClass.classroom_name },
    subject: additionalClass.subject_id
      ? { id: additionalClass.subject_id, name: additionalClass.subject_name }
      : null,
    staff: additionalClass.staff_id
      ? { id: additionalClass.staff_id, name: additionalClass.staff_name }
      : null,
    session_type: additionalClass.class_type, // "makeup" | "extra"
    // Only meaningful for makeup classes (null for extra / when not entered)
    original_class_date: additionalClass.original_class_date ?? null,
    original_period_no: additionalClass.original_period_no ?? null,
    remarks: session?.remarks ?? additionalClass.reason ?? null,
    period: null, // additional classes have no timetable period
    start_time: hhmm(additionalClass.start_time),
    end_time: hhmm(additionalClass.end_time),
    duration: {
      minutes: durationMinutes,
      label: `${durationMinutes} min`,
    },
    status: deriveStatus(session?.session_status, additionalClass.status), // pending | completed | cancelled
  };
};

const getSlotDetail = asyncHandler(async (req, res) => {
  const id = Number(req.params.slot_id);
  const q = req.validatedQuery ?? req.query;
  const { date, type } = q; // both required by slotDetailQuerySchema

  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(
      422,
      type === "extra" ? "Invalid additional_class_id." : "Invalid slot_id."
    );
  }

  // ---- extra (makeup / extra class) -> additional_classes table -----------
  if (type === "extra") {
    const data = await buildAdditionalClassDetail(id, date);
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Additional class details fetched successfully."));
  }

  // ---- regular -> timetable (unchanged) ------------------------------------
  const row = await getSlotDetailById(id, date);
  if (!row) throw new ApiError(404, "Timetable slot not found.");

  // The slot belongs to a fixed weekday; the date must fall on that weekday.
  const dayName = WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
  if (String(row.slot_day_name).toUpperCase() !== dayName.toUpperCase()) {
    throw new ApiError(
      422,
      `This slot is scheduled on ${row.slot_day_name}, but ${date} is a ${dayName}.`
    );
  }

  const data = {
    timetable_slot_id: row.timetable_slot_id,
    additional_class_id: null,
    attendance_session_id: row.attendance_session_id ?? null,
    academic_term: { id: row.academic_term_id, name: row.academic_term_name },
    attendance_date: date,
    day: dayName,
    classroom: { id: row.classroom_id, name: row.classroom_name },
    subject: row.subject_id ? { id: row.subject_id, name: row.subject_name } : null,
    staff: row.staff_id ? { id: row.staff_id, name: row.staff_name } : null,
    session_type: "regular",
    original_class_date: null,
    original_period_no: null,
    remarks: row.remarks ?? null,
    period: {
      id: row.period_id,
      name: row.period_label,
      order: row.period_order,
    },
    start_time: hhmm(row.start_time),
    end_time: hhmm(row.end_time),
    duration: {
      minutes: Number(row.duration_minutes),
      label: `${Number(row.duration_minutes)} min`,
    },
    status: deriveStatus(row.attendance_session_status, undefined), // pending | completed | cancelled
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Period details fetched successfully."));
});

module.exports = { getDateView, getSlotDetail };