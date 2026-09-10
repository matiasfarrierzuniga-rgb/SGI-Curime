import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trim } from '../../common/validation/normalizers';

export class CreateAffiliateRequestDto {
  @Type(() => Date) @IsDate() @MaxDate(new Date()) birthDate: Date;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender?: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) address: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  occupation?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  workplace?: string;
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  affiliationReason: string;
}
