import { httpClient } from '../api/httpClient'
import type { ApiMessage } from '../types/api'
import type { AuthenticatedUser, LoginCredentials, LoginResponse, PasswordWithConfirmation } from '../types/auth'

export const authService = {
  async login(payload: LoginCredentials) { return (await httpClient.post<LoginResponse>('/auth/login', payload)).data },
  async me() { return (await httpClient.get<AuthenticatedUser>('/auth/me')).data },
  async activate(payload: PasswordWithConfirmation) { return (await httpClient.post<ApiMessage>('/auth/activate-account', payload)).data },
  async forgotPassword(email: string) { return (await httpClient.post<ApiMessage>('/auth/forgot-password', { email })).data },
  async resetPassword(payload: PasswordWithConfirmation) { return (await httpClient.post<ApiMessage>('/auth/reset-password', payload)).data },
  async changePassword(payload: { currentPassword: string; password: string; passwordConfirmation: string }) { return (await httpClient.patch<ApiMessage>('/auth/change-password', payload)).data },
}
