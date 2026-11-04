export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  sessionGeneration?: number;
}
