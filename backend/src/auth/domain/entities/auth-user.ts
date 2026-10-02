export interface AuthenticatedUser {
  id: number;
  fullName: string;
  email: string;
  status: string;
  role: string;
  permissionCodes?: readonly string[];
  canAccessErp: boolean;
  subscriptionExpirationDate?: Date;
}
