import { IsDateString, IsOptional } from 'class-validator';

export class CreateBoardTermDto {
  @IsDateString({ strict: true }) startsOn!: string;
  @IsDateString({ strict: true }) endsOn!: string;
}

export class UpdateBoardTermDto {
  @IsOptional() @IsDateString({ strict: true }) startsOn?: string;
  @IsOptional() @IsDateString({ strict: true }) endsOn?: string;
}
