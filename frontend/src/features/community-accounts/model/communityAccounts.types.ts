export interface CreateCommunityAccount {
  firstName: string
  firstSurname: string
  secondSurname?: string
  identificationType: 'NATIONAL' | 'DIMEX'
  identification: string
  email: string
  phoneCountryCode?: string
  phoneNationalNumber?: string
  privacyAcknowledgement: boolean
}

export interface CommunityAcknowledgement { message: string }
