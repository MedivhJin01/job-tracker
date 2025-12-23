export class APIError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

// Predefined Errors
export class InvalidError extends APIError {
    constructor(message = "Invalid Data Provided") {
        super(message, 400);
    }
}

export class UnauthorizedError extends APIError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class NotFoundError extends APIError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}

export class ConflictError extends APIError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

export class InternalServerError extends APIError {
    constructor(message = "Internal Server Error") {
        super(message, 500);
    }
}

export class NoFeedbackError extends APIError {
    constructor(message = "No Feedback") {
        super(message, 502)
    }
}