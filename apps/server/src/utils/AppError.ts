export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.name = code;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}
