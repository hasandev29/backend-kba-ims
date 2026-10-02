// src/middlewares/validators/batch.validator.js

"use strict";

const Joi = require("joi");

const fields = {
  course_id  : Joi.number().integer().positive(),
  batch_name : Joi.string().trim().min(1).max(100),
  start_year : Joi.number().integer().min(2000),
  end_year   : Joi.number()
    .integer()
    .min(Joi.ref("start_year"))
    .messages({"number.min": "end_year must be greater than or equal to start_year."}),
};

// Create — all required
const createBatchSchema = Joi.object({
  course_id  : fields.course_id.required(),
  batch_name : fields.batch_name.required(),
  start_year : fields.start_year.required(),
  end_year   : fields.end_year.required(),
}).options({ allowUnknown: false });

// Update — all optional, but at least one field, and at least 1 char somewhere
const updateBatchSchema = Joi.object({
  course_id  : fields.course_id.optional(),
  batch_name : fields.batch_name.optional(),
  start_year : fields.start_year.optional(),
  end_year   : fields.end_year.optional(),
})
  .min(1)
  .options({ allowUnknown: false });

// Query filters for GET /batches
const getBatchesQuerySchema = Joi.object({
  course_id  : Joi.number().integer().positive().optional(),
  start_year : Joi.number().integer().min(2000).optional(),
  end_year   : Joi.number().integer().min(2000).optional(),
  q          : Joi.string().trim().max(100).allow("").optional(),
  page       : Joi.number().integer().min(1).optional(),
  limit      : Joi.number().integer().min(1).max(100).optional(),
}).options({ allowUnknown: false });

module.exports = { createBatchSchema, updateBatchSchema, getBatchesQuerySchema };