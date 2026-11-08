import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';

export enum VerificationMethod {
  ADMINISTRATIVE_REVIEW = 'ADMINISTRATIVE_REVIEW',
}

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class LinkAccountPersonDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  personId!: number;

  @IsEnum(VerificationMethod)
  verificationMethod!: VerificationMethod;

  @Transform(trim)
  @IsString()
  @MaxLength(120)
  evidenceReference!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason!: string;
}
