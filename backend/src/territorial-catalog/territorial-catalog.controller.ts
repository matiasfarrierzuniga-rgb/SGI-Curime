import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CantonsQueryDto,
  DistrictsQueryDto,
  LocalitiesQueryDto,
  ValidateTerritorialCatalogDto,
} from './dto/territorial-catalog.dto';
import { TerritorialCatalogService } from './territorial-catalog.service';

@Controller('territorial-catalog')
export class TerritorialCatalogController {
  constructor(private readonly catalog: TerritorialCatalogService) {}
  @Get('provinces') provinces() {
    return this.catalog.provinces();
  }
  @Get('cantons') cantons(@Query() query: CantonsQueryDto) {
    return this.catalog.cantons(query.provinceCode);
  }
  @Get('districts') districts(@Query() query: DistrictsQueryDto) {
    return this.catalog.districts(query.provinceCode, query.cantonCode);
  }
  @Get('localities') localities(@Query() query: LocalitiesQueryDto) {
    return this.catalog.localities(
      query.provinceCode,
      query.cantonCode,
      query.districtCode,
    );
  }
  @Post('validate') validate(@Body() dto: ValidateTerritorialCatalogDto) {
    return this.catalog.validate(dto);
  }
}
