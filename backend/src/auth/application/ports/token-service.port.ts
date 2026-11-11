export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenClaims {
  sub: number;
  email: string;
  role: string;
  sessionGeneration: number;
  sid: number;
}

export interface TokenService {
  sign(claims: TokenClaims): Promise<string>;
}
