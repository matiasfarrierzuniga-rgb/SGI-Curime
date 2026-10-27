import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryNotificationsDto {
  @IsOptional()
  @IsIn(['ALL', 'UNREAD'])
  filter: 'ALL' | 'UNREAD' = 'ALL';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
