/**
 * AuthError is emitted whenever the program is terminated due to wrong or missing credentials.
 * @remarks
 * This error is expected when the KOS_USERNAME or KOS_PASSWORD environment variables are not set or are incorrect.
 * In this case, the program will terminate.
 */
export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

/**
 * ServerError is emitted whenever there is a TimeoutError that indicates the server might be overloaded.
 * @remarks
 * This error is expected when the KOS server is under heavy load or is down.
 * In this case, the program will attempt to restart after a set amount of time.
 */
export class ServerError extends Error {
    constructor(message: string) {
      super(message);
      Object.setPrototypeOf(this, ServerError.prototype);
    }
  }