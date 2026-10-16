export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown,
    readonly extra?: Record<string, unknown>
  ) {
    super(message);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Please log in to continue') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have access to this resource', extra?: Record<string, unknown>) {
    return new ApiError(403, message, undefined, extra);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string) {
    return new ApiError(429, message);
  }
}
