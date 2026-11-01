import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssemblyQuorumType } from '../../../generated/prisma/enums';

export class AssemblyCallDto {
  @Type(() => Number) @IsInt() @Min(1) callNumber: number;
  @Type(() => Date) @IsDate() scheduledAt: Date;
  @IsEnum(AssemblyQuorumType) quorumType: AssemblyQuorumType;
  @Type(() => Number) @IsInt() @Min(1) quorumValue: number;
}

export class UpdateAssemblyCallsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssemblyCallDto)
  calls: AssemblyCallDto[];
}
