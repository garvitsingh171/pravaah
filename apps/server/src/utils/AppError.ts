export type AppErrorDetail = {
    field: string;
    message: string;
};

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details: AppErrorDetail[] | undefined;

    constructor(statusCode: number, code: string, message: string, details?: AppErrorDetail[]) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = code;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}
