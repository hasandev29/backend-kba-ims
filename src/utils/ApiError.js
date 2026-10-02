"use strict";

// =============================================================================
// ApiError
// A structured error class that controllers throw.
// The global error handler catches these and sends the right HTTP response.
// =============================================================================
class ApiError extends Error {
  constructor(statusCode, message, errors = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;      // { field: "message" } — for frontend field highlighting
    this.errorCode  = errorCode;   // machine-readable code e.g. "DUPLICATE_USER_ID"
    this.isApiError = true;
  }

  // ── Factories ──────────────────────────────────────────────────────────────

  static badRequest(message = "Bad request.", errors = null) {
    return new ApiError(400, message, errors, "BAD_REQUEST");
  }

  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, message, null, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, message, null, "FORBIDDEN");
  }

  static notFound(message = "Resource not found.") {
    return new ApiError(404, message, null, "NOT_FOUND");
  }

  static conflict(message = "Conflict.", errors = null) {
    return new ApiError(409, message, errors, "CONFLICT");
  }

  static validationFailed(errors) {
    return new ApiError(422, "Validation failed.", errors, "VALIDATION_FAILED");
  }

  static internal(message = "Something went wrong.") {
    return new ApiError(500, message, null, "INTERNAL_SERVER_ERROR");
  }
}

module.exports = ApiError;