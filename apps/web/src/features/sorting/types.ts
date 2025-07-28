export type SortAndFilterParams<K extends string = string> = {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    sortBy?: K;
    sortDirection?: "asc" | "desc";
};
