import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { GovernanceTermStatus } from '../../../generated/prisma/enums';

export class CreateBoardTermDto {
  @IsDateString({ strict: true }) startsOn!: string;
  @IsDateString({ strict: true }) endsOn!: string;
}

export class UpdateBoardTermDto {
  @IsOptional() @IsDateString({ strict: true }) startsOn?: string;
  @IsOptional() @IsDateString({ strict: true }) endsOn?: string;
  @IsOptional() @IsEnum(GovernanceTermStatus) status?: GovernanceTermStatus;
}
