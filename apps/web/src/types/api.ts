export type ApiSuccessResponse<T> = {
    success: true;
    data: T;
    message?: string;
};

export type ApiErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
    };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
};