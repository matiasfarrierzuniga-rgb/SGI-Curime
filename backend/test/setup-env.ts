process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.MAX_LOGIN_ATTEMPTS ??= '3';
process.env.ACCOUNT_LOCKOUT_MINUTES ??= '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ??= '30';
process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS ??= '60';
process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX ??= '3';
