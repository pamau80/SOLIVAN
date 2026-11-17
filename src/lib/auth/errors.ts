export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  readonly status = 401;

  constructor(message = "No autenticado") {
    super(message);
    this.name = "AuthenticationError";
  }
}
