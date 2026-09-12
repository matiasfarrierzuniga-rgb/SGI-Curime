import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ApproveAffiliateRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId: number;
}
