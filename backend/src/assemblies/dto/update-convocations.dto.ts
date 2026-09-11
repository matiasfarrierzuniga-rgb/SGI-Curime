import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class UpdateConvocationsDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  affiliateIds: number[];
}
