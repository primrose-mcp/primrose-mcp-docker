/**
 * Error Handling Utilities
 *
 * Custom error classes and error handling helpers for Docker operations.
 */

/**
 * Base Docker API error
 */
export class DockerApiError extends Error {
  public statusCode?: number;
  public code: string;
  public retryable: boolean;

  constructor(message: string, statusCode?: number, code?: string, retryable = false) {
    super(message);
    this.name = 'DockerApiError';
    this.statusCode = statusCode;
    this.code = code || 'DOCKER_ERROR';
    this.retryable = retryable;
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends DockerApiError {
  public retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends DockerApiError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_FAILED', false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends DockerApiError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with ID '${id}' not found`, 404, 'NOT_FOUND', false);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends DockerApiError {
  public details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Connection error for Docker daemon
 */
export class ConnectionError extends DockerApiError {
  constructor(message: string) {
    super(message, 503, 'CONNECTION_ERROR', true);
    this.name = 'ConnectionError';
  }
}

/**
 * Conflict error (e.g., container already running)
 */
export class ConflictError extends DockerApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', false);
    this.name = 'ConflictError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof DockerApiError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    // Network errors are typically retryable
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ECONNREFUSED')
    );
  }
  return false;
}

/**
 * Format an error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof DockerApiError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      ...(error instanceof RateLimitError && { retryAfterSeconds: error.retryAfterSeconds }),
      ...(error instanceof ValidationError && { details: error.details }),
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error: String(error) };
}

/**
 * Parse Docker API error response
 */
export function parseDockerError(statusCode: number, body: string): DockerApiError {
  let message = `Docker API error: ${statusCode}`;
  try {
    const errorJson = JSON.parse(body);
    message = errorJson.message || errorJson.error || message;
  } catch {
    if (body) {
      message = body;
    }
  }

  switch (statusCode) {
    case 400:
      return new ValidationError(message);
    case 401:
    case 403:
      return new AuthenticationError(message);
    case 404:
      return new NotFoundError('Resource', 'unknown');
    case 409:
      return new ConflictError(message);
    case 429:
      return new RateLimitError(message, 60);
    case 500:
      return new DockerApiError(message, statusCode, 'INTERNAL_ERROR', true);
    case 503:
      return new ConnectionError(message);
    default:
      return new DockerApiError(message, statusCode);
  }
}
