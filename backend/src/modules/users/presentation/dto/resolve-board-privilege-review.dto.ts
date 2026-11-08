import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsString, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export const PRIVILEGE_REVIEW_DECISIONS = ['NO_CHANGE', 'ROLE_CHANGED'] as const;
export type PrivilegeReviewDecision = (typeof PRIVILEGE_REVIEW_DECISIONS)[number];

export class ResolveBoardPrivilegeReviewDto {
  @IsIn(PRIVILEGE_REVIEW_DECISIONS)
  decision!: PrivilegeReviewDecision;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @MinLength(3) @MaxLength(1000)
  justification!: string;

  @ValidateIf((dto: ResolveBoardPrivilegeReviewDto) => dto.decision === 'ROLE_CHANGED')
  @Type(() => Number) @IsInt() @Min(1)
  roleId?: number;
}
