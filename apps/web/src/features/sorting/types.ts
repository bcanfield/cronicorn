export type SortAndFilterParams<K extends string = string> = {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    sortBy?: K;
    sortDirection?: "asc" | "desc";
};

/**
 * Represents a change request for sorting controls.
 */
export type SortChange<K extends string> = Partial<{ sortBy: K; sortDirection: "asc" | "desc" }>;

/**
 * Props for the sort controls component.
 */
export type SortControlsProps<K extends string> = {
    sortKeys: readonly K[];
    sortBy?: K;
    sortDirection?: "asc" | "desc";
    onChange: (change: SortChange<K>) => void;
};

/**
 * Represents a change request for pagination controls.
 */
export type PaginationChange = Partial<{ page: number; pageSize: number }>;

/**
 * Props for the pagination controls component.
 */
export type PaginationControlsProps = {
    page?: number;
    pageSize?: number;
    hasNext?: boolean;
    onChange: (change: PaginationChange) => void;
};

/**
 * Props for the combined sorting container.
 * @template K - sort key type
 * @template P - parent params including optional page, pageSize, sortBy, sortDirection
 */
export type SortingContainerProps<
    K extends string,
    P extends { page?: number; pageSize?: number; sortBy?: K; sortDirection?: "asc" | "desc" },
> = {
    /** List of available sort keys */
    sortKeys: readonly K[];
    /** All query params including page, pageSize, sortBy and sortDirection */
    params: P;
    /** Callback to replace all params at once */
    onChange: (params: P) => void;
    /** Show or hide pagination next button */
    hasNext?: boolean;
    /** Optional children to render below controls */
    children?: React.ReactNode;
};
