export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data,
  };
}
