import { httpClient } from '@/shared/api/httpClient'
import type { CommunityAcknowledgement, CreateCommunityAccount } from '../model/communityAccounts.types'

export const communityAccountsService = {
  async register(payload: CreateCommunityAccount) { return (await httpClient.post<CommunityAcknowledgement>('/community-accounts/register', payload)).data },
  async validateToken(token: string) { return (await httpClient.post<CommunityAcknowledgement>('/community-accounts/validate-token', { token })).data },
  async verifyEmail(token: string, password: string, passwordConfirmation: string) { return (await httpClient.post<CommunityAcknowledgement>('/community-accounts/verify-email', { token, password, passwordConfirmation })).data },
  async resendVerification(email: string) { return (await httpClient.post<CommunityAcknowledgement>('/community-accounts/resend-verification', { email })).data },
}
