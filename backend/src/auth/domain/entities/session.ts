export interface Session {
  id: number;
  userId: number;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
}
