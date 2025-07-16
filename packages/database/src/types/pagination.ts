import z from "zod";

export const PaginationSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  })
  .optional();

export type PaginationParams = z.infer<typeof PaginationSchema>;

export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
};

export const getPagination = (params?: PaginationParams) => {
  if (!params) {
    return DEFAULT_PAGINATION;
  }
  return {
    page: params.page || DEFAULT_PAGINATION.page,
    limit: params.limit || DEFAULT_PAGINATION.limit,
  };
};
