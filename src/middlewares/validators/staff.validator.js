// =============================================================================
// staff.validator.js
//
// Joi schemas for staff endpoints. Mirrors student.validator.js conventions —
// schemas are consumed by the generic `validate(schema)` router middleware,
// which validates req.body and attaches the cleaned result as req.validatedBody.
//
// Design decisions (same as student.validator.js):
//   • Nested objects use .options({ allowUnknown: false }) so stray keys are
//     rejected.
//   • Fields that go through sanitize() in the model are .allow("", null).
//   • CREATE sub-schemas default missing optional fields (via nullableStr /
//     nullableInt / .default(...)).
//   • UPDATE (PATCH) sub-schemas have NO Joi .default() and nothing is
//     .required() (besides item-level required fields on array replacements) —
//     every key is truly optional so req.validatedBody only ever contains the
//     keys the client actually sent. Each section schema is .min(1) so an
//     empty PATCH for that section is rejected.
//
// SCHEMA NOTE — qualifications is a single 1:1 object for staff (unlike
// student, where it's a 1:N array). The payload key is `text`, but the
// underlying DB column is `staff_qualifications.qualifications` — the model
// handles that column-name mismatch explicitly rather than through the
// generic buildSetClause().
// =============================================================================

"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/** Any string that may be omitted, blank, or null → normalized to null */
const nullableStr = () =>
  Joi.string().allow("", null).optional().default(null);

/** Positive integer or null — used for lookup ID columns */
const nullableInt = () =>
  Joi.number().integer().positive().allow(null).optional().default(null);

// ---------------------------------------------------------------------------
// Sub-schemas — CREATE
// ---------------------------------------------------------------------------

const accountSchema = Joi.object({
  user_id  : Joi.string().trim().required(),
  role     : Joi.string().trim().required(),
  status   : Joi.string().trim().optional().default("active"),
  password : Joi.string().min(6).required(),
}).options({ allowUnknown: false });

const personalDetailsSchema = Joi.object({
  name              : Joi.string().trim().required(),
  staff_uid         : Joi.string().trim().required(),
  short_name        : nullableStr(),
  salutation        : Joi.number().integer().min(1).allow(null).optional().default(null),
  gender            : Joi.number().integer().valid(1, 2, 3).optional().default(1),
  dob               : Joi.date().iso().allow(null).optional().default(null),
  blood_group       : nullableInt(),
  mobile_number     : nullableStr(),
  emergency_contact : nullableStr(),
  personal_email    : Joi.string().email().allow("", null).optional().default(null),
  religion_id       : nullableInt(),
  marital_status    : Joi.number().integer().min(1).allow(null).optional().default(null),
  medical_remarks   : nullableStr(),
  photo_url         : nullableStr(),
  date_of_joining   : Joi.date().iso().allow(null).optional().default(null),
}).options({ allowUnknown: false });

const employmentDetailsSchema = Joi.object({
  staff_type              : nullableInt(),
  designation             : nullableInt(),
  experience_years        : Joi.number().min(0).allow(null).optional().default(null),
  employment_nature       : nullableInt(),
  employment_place        : nullableInt(),
  university_id           : nullableStr(),
  university_designation  : nullableInt(),
  university_experience   : nullableInt(),
  work_email              : Joi.string().email().allow("", null).optional().default(null),
  notes                   : nullableStr(),
}).options({ allowUnknown: false });

const qualificationsSchema = Joi.object({
  text : nullableStr(),
}).options({ allowUnknown: false });

const addressSchema = Joi.object({
  address_type : Joi.number().integer().valid(1, 2).required(), // 1=Permanent, 2=Present
  door_no      : nullableStr(),
  street       : nullableStr(),
  area         : nullableStr(),
  city         : nullableStr(),
  district     : nullableStr(),
  state        : nullableStr(),
  pin_code     : nullableStr(),
  country      : nullableStr(),
}).options({ allowUnknown: false });

const otherDetailsSchema = Joi.object({
  aadhar_no      : nullableStr(),
  aadhar_doc_url : nullableStr(),
  pan_no         : nullableStr(),
  pan_doc_url    : nullableStr(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Root schema — POST /api/staff
// ---------------------------------------------------------------------------

const createStaffSchema = Joi.object({
  account            : accountSchema.required(),
  personal_details   : personalDetailsSchema.required(),
  employment_details : employmentDetailsSchema.optional().default({}),
  qualifications     : qualificationsSchema.optional().default({ text: null }),
  address            : Joi.array().items(addressSchema).optional().default([]),
  other_details      : otherDetailsSchema.optional().default({}),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// Query schema — GET /api/staff/list
// ---------------------------------------------------------------------------

const getStaffListQuerySchema = Joi.object({
  staff_type       : Joi.number().integer().positive().optional(),
  employment_place : Joi.number().integer().positive().optional(),
  status           : Joi.string().trim().max(50).optional(),
  q                : Joi.string().trim().max(100).allow("").optional(),
  page             : Joi.number().integer().min(1).optional(),
  limit            : Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

// ---------------------------------------------------------------------------
// UPDATE (PATCH) schemas — every field is optional, nothing has a Joi
// .default(), and nothing is forced .required(). This is deliberate:
// req.validatedBody must only contain the keys the client actually sent,
// otherwise the model can't tell "field omitted" apart from "field reset".
// ---------------------------------------------------------------------------

const updateAccountSchema = Joi.object({
  user_id : Joi.string().trim().optional(),
  role    : Joi.string().trim().optional(),
  status  : Joi.string().trim().optional(),
}).options({ allowUnknown: false }).min(1);

const updatePersonalDetailsSchema = Joi.object({
  name              : Joi.string().trim().optional(),
  staff_uid         : Joi.string().trim().optional(),
  short_name        : Joi.string().allow("", null).optional(),
  salutation        : Joi.number().integer().min(1).allow(null).optional(),
  gender            : Joi.number().integer().valid(1, 2, 3).optional(),
  dob               : Joi.date().iso().allow(null).optional(),
  blood_group       : Joi.number().integer().positive().allow(null).optional(),
  mobile_number     : Joi.string().allow("", null).optional(),
  emergency_contact : Joi.string().allow("", null).optional(),
  personal_email    : Joi.string().email().allow("", null).optional(),
  religion_id       : Joi.number().integer().positive().allow(null).optional(),
  marital_status    : Joi.number().integer().min(1).allow(null).optional(),
  medical_remarks   : Joi.string().allow("", null).optional(),
  photo_url         : Joi.string().allow("", null).optional(),
  date_of_joining   : Joi.date().iso().allow(null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateEmploymentDetailsSchema = Joi.object({
  staff_type              : Joi.number().integer().positive().allow(null).optional(),
  designation              : Joi.number().integer().positive().allow(null).optional(),
  experience_years         : Joi.number().min(0).allow(null).optional(),
  employment_nature        : Joi.number().integer().positive().allow(null).optional(),
  employment_place         : Joi.number().integer().positive().allow(null).optional(),
  university_id            : Joi.string().allow("", null).optional(),
  university_designation   : Joi.number().integer().positive().allow(null).optional(),
  university_experience    : Joi.number().min(0).allow(null).optional(),
  work_email               : Joi.string().email().allow("", null).optional(),
  notes                    : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateQualificationsSchema = Joi.object({
  text : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

const updateOtherDetailsSchema = Joi.object({
  aadhar_no      : Joi.string().allow("", null).optional(),
  aadhar_doc_url : Joi.string().allow("", null).optional(),
  pan_no         : Joi.string().allow("", null).optional(),
  pan_doc_url    : Joi.string().allow("", null).optional(),
}).options({ allowUnknown: false }).min(1);

// =============================================================================
// SINGLE PATCH SCHEMA — PATCH /api/staff/:id
//
// The frontend sends only the node(s)/section(s) that actually changed.
// Every key here is optional so req.validatedBody only ever contains what
// the client sent — nothing is defaulted, nothing is forced.
//
// address (array) is a FULL REPLACEMENT when present — each item still needs
// its "required" fields, same shape as create. Sending an empty array []
// clears the section entirely; omitting the key leaves it untouched.
// =============================================================================
const patchStaffSchema = Joi.object({
  account            : updateAccountSchema.optional(),
  personal_details   : updatePersonalDetailsSchema.optional(),
  employment_details : updateEmploymentDetailsSchema.optional(),
  qualifications     : updateQualificationsSchema.optional(),
  address            : Joi.array().items(addressSchema).optional(),
  other_details      : updateOtherDetailsSchema.optional(),
}).options({ allowUnknown: false }).min(1);

const bulkUpdateStaffSchema = Joi.object({
  staff_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required(),

  status            : Joi.string().valid("active", "inactive").allow(null),
  employment_place  : Joi.string().max(255).allow(null, ""), // ← match your existing employment_place rule
}).options({ allowUnknown: false });

module.exports = {
  createStaffSchema,
  getStaffListQuerySchema,
  patchStaffSchema,
  bulkUpdateStaffSchema
};