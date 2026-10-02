// src/middlewares/error.middleware.js

"use strict";

const { v4: uuidv4 } = require("uuid");
const ApiError        = require("../utils/ApiError");

// =============================================================================
// MySQL error code → ApiError mapping
// Converts raw DB errors into safe, frontend-friendly responses.
// The client NEVER sees SQL queries, table names, or constraint names.
// =============================================================================
const handleMySQLError = (err) => {
  switch (err.code) {

    case "ER_DUP_ENTRY": {
      // Parse constraint name to identify which field is duplicated
      const constraint = err.sqlMessage || "";

      if (constraint.includes("uq_user_id") || constraint.includes("user_id")) {
        return ApiError.conflict("User ID already exists.", {
          user_id: "This User ID is already in use.",
        });
      }
      if (constraint.includes("email")) {
        return ApiError.conflict("Email already exists.", {
          email: "This email is already registered.",
        });
      }
      return ApiError.conflict("A duplicate entry was detected.");
    }

    case "ER_NO_REFERENCED_ROW_2":
      return new ApiError(422, "Invalid reference. One or more related records do not exist.", null, "INVALID_REFERENCE");

    case "ER_ROW_IS_REFERENCED_2":
      return new ApiError(409, "Cannot delete this record because it is referenced by other data.", null, "REFERENCED_ROW");

    case "ER_BAD_NULL_ERROR":
      return ApiError.badRequest("A required field is missing.");

    case "ER_DATA_TOO_LONG":
      return ApiError.badRequest("One or more fields exceed the maximum allowed length.");

    case "ER_TRUNCATED_WRONG_VALUE":
      return ApiError.badRequest("One or more fields contain an invalid value.");

    case "ER_PARSE_ERROR":
      // Never expose SQL parse errors to client
      return ApiError.internal();

    default:
      return null;
  }
};

// =============================================================================
// Global Error Handler — must be registered LAST in Express middleware chain
// =============================================================================
const errorHandler = (err, req, res, next) => {
  const requestId = uuidv4();

  // ── Known ApiError ─────────────────────────────────────────────────────────
  if (err.isApiError) {
    const response = {
      success  : false,
      message  : err.errors
        ? Object.values(err.errors).join(" | ")
        : err.message,
      requestId,
    };
    if (err.errors)    response.errors    = err.errors;
    if (err.errorCode) response.errorCode = err.errorCode;

    return res.status(err.statusCode).json(response);
  }

  // ── MySQL Error ─────────────────────────────────────────────────────────────
  if (err.code && err.code.startsWith("ER_")) {
    const apiError = handleMySQLError(err);
    if (apiError) {
      const response = {
        success  : false,
        message  : apiError.message,
        requestId,
      };
      if (apiError.errors)    response.errors    = apiError.errors;
      if (apiError.errorCode) response.errorCode = apiError.errorCode;
      return res.status(apiError.statusCode).json(response);
    }
  }

  // ── Unknown / Unhandled Error ───────────────────────────────────────────────
//   return res.status(500).json({
//     success   : false,
//     message   : "Something went wrong.",
//     requestId,
//     timestamp : new Date().toISOString(),
//     errorCode : "INTERNAL_SERVER_ERROR",
//   });
// };
// Always log the full error server-side so it's visible in the console,
// regardless of what we choose to expose to the client.
console.error("[UNHANDLED ERROR]", err);

const isProd = process.env.NODE_ENV === "production";

return res.status(500).json({
success   : false,
message   : isProd ? "Something went wrong." : err.message,
requestId,
timestamp : new Date().toISOString(),
errorCode : "INTERNAL_SERVER_ERROR",
...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;