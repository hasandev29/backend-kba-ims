// src/middlewares/validate.middleware.js

"use strict";

const ApiError = require("../utils/ApiError");

// =============================================================================
// validate(schema)
// Pass a Joi schema → returns Express middleware that validates req.body.
// On failure throws ApiError.validationFailed with field-wise error map.
// Controllers stay completely clean of validation logic.
//
// Usage:
//   router.post("/", validate(createUserSchema), userController.create);
// =============================================================================
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly : false,
    convert    : true,
  });

  if (error) {
    // Convert Joi error array → { fieldName: "message" } map for frontend
    const errors = {};
    error.details.forEach((d) => {
      const field = d.path.join(".");
      errors[field] = d.message.replace(/['"]/g, "");
    });
    return next(ApiError.validationFailed(errors));
  }

  req.validatedBody = value; // controllers read from req.validatedBody
  next();
};

module.exports = validate;