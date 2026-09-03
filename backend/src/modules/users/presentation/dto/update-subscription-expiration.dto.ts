import { IsDateString, Matches } from 'class-validator';

export class UpdateSubscriptionExpirationDto {
  @IsDateString()
  @Matches(/Z$/, { message: 'subscriptionExpirationDate must be UTC' })
  subscriptionExpirationDate: string;
}
