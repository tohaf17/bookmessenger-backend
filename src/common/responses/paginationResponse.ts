export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}
