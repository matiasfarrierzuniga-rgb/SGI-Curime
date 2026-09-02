export const REFRESH_TOKEN_SERVICE = Symbol('REFRESH_TOKEN_SERVICE');

export interface RefreshTokenPort {
  generate(): string;
  hash(token: string): string;
}
