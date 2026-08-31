import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EventStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEventDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500) summary: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Type(() => Date) @IsDate() startAt: Date;
  @Type(() => Date) @IsOptional() @IsDate() endAt?: Date;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) location?: string;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
}

export class UpdateEventDto {
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500) summary?: string;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @Type(() => Date) @IsOptional() @IsDate() startAt?: Date;
  @Type(() => Date) @IsOptional() @IsDate() endAt?: Date;
  @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) location?: string;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
}
