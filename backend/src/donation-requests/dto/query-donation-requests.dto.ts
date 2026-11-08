import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DonationRequestStatus } from '../../../generated/prisma/enums';

export class QueryDonationRequestsDto {
  @IsOptional()
  @IsEnum(DonationRequestStatus)
  status?: DonationRequestStatus;
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
