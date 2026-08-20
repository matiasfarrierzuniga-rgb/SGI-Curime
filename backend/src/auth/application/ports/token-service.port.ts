export interface TokenClaims {
  sub: number;
  email: string;
  role: string;
}

export interface TokenService {
  sign(claims: TokenClaims): Promise<string>;
}
