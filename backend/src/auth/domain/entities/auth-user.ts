export interface AuthenticatedUser {
  id: number;
  displayName: string;
  email: string;
  status: string;
  role: string;
  permissionCodes?: readonly string[];
  canAccessErp: boolean;
  subscriptionExpirationDate?: Date;
  /** Internal authenticated-session identity. Never serialize in public auth responses. */
  sessionId?: number;
}
