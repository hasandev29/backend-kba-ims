"use strict";

// =============================================================================
// ApiResponse
// Standardizes every success response shape across all controllers.
// =============================================================================
class ApiResponse {
  constructor(statusCode, data, message = "Success.", pagination = null) {
    this.success    = true;
    this.message    = message;
    if (pagination)   this.pagination = pagination;
    if (data !== null && data !== undefined) this.data = data;
  }
}

module.exports = ApiResponse;