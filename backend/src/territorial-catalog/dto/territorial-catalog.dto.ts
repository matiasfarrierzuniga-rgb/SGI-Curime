import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CantonsQueryDto {
  @IsString() @Matches(/^\d$/) provinceCode!: string;
}
export class DistrictsQueryDto extends CantonsQueryDto {
  @IsString() @Matches(/^\d{2}$/) cantonCode!: string;
}
export class LocalitiesQueryDto extends DistrictsQueryDto {
  @IsString() @Matches(/^\d{2}$/) districtCode!: string;
}
export class ValidateTerritorialCatalogDto extends LocalitiesQueryDto {
  @IsString() @IsNotEmpty() @Length(1, 120) catalogVersion!: string;
  @IsString() @Matches(/^loc_[a-f0-9]{24}$/) localityKey!: string;
}
