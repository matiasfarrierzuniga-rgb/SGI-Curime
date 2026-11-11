import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateReservationDto {
  @Type(() => Number) @IsInt() @Min(1) resourceId!: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) eventId?: number;
  @Type(() => Date) @IsDate() startAt!: Date;
  @Type(() => Date) @IsDate() endAt!: Date;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(1000) purpose!: string;
  @IsIn(["DANCES", "SPORTS", "BINGO", "TEA_BASKET", "BIRTHDAY", "WEDDING", "MOVIE", "MOONLIGHT", "TALKS"]) activity!: string;
  @IsIn(["GROUPS_COMMITTEES", "MEMBERS", "PRIVATE"]) applicantCategory!: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(1) estimatedAttendees?: number;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) notes?: string;
}
