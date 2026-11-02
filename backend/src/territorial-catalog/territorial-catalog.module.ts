import { Module } from '@nestjs/common';
import { TerritorialCatalogController } from './territorial-catalog.controller';
import { TerritorialCatalogService } from './territorial-catalog.service';

@Module({
  controllers: [TerritorialCatalogController],
  providers: [TerritorialCatalogService],
  exports: [TerritorialCatalogService],
})
export class TerritorialCatalogModule {}
