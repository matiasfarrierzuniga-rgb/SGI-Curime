export interface AuthenticatedUser { id: number; fullName: string; email: string; status: string; role: string }
export interface LoginCredentials { email: string; password: string }
export interface LoginResponse { accessToken: string; user: AuthenticatedUser }
export interface PasswordWithConfirmation { token: string; password: string; passwordConfirmation: string }
export interface StoredSession { token: string; user: AuthenticatedUser }
