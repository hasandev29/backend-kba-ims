"use strict";

/**
 * Resolves pagination from req.query.
 * Pagination is opt-in: only kicks in if the caller sent `page` or `limit`.
 * Otherwise returns { paginate: false, limit: null, offset: null } so the
 * caller can fetch every matching row.
 */
const resolvePagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const paginate = query.page !== undefined || query.limit !== undefined;

  if (!paginate) {
    return { paginate: false, page: null, limit: null, offset: null };
  }

  const page   = Math.max(1, parseInt(query.page) || 1);
  const limit  = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;

  return { paginate: true, page, limit, offset };
};

/** Builds the response `meta` block for a paginated/unpaginated list. */
const buildPaginationMeta = ({ paginate, total, page, limit, extra = {} }) =>
  paginate ? { total, page, limit, totalPages: Math.ceil(total / limit), ...extra } : { total, ...extra };

module.exports = { resolvePagination, buildPaginationMeta };