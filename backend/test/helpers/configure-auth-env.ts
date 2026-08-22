process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS ?? '3';
process.env.ACCOUNT_LOCKOUT_MINUTES =
  process.env.ACCOUNT_LOCKOUT_MINUTES ?? '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES =
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? '30';

export {};
