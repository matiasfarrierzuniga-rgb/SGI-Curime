import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AssemblyQuorumType,
  AssemblyStatus,
} from '../../../generated/prisma/enums';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CreateAssemblyDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type?: string;
  @Type(() => Date) @IsDate() date: Date;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) place: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;
  @IsOptional() @IsEnum(AssemblyStatus) status?: AssemblyStatus;
  @IsEnum(AssemblyQuorumType) quorumType: AssemblyQuorumType;
  @Type(() => Number) @IsNumber() @Min(1) quorumValue: number;
}
export class UpdateAssemblyDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type?: string;
  @Type(() => Date) @IsOptional() @IsDate() date?: Date;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  place?: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;
  @IsOptional() @IsEnum(AssemblyStatus) status?: AssemblyStatus;
  @IsOptional() @IsEnum(AssemblyQuorumType) quorumType?: AssemblyQuorumType;
  @Type(() => Number) @IsOptional() @IsNumber() @Min(1) quorumValue?: number;
}
