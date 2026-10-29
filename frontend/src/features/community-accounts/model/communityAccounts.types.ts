export interface CreateCommunityAccount {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
  privacyAcknowledgement: boolean
}

export interface CommunityAcknowledgement { message: string }
