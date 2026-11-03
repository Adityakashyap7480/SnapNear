import { Global, Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { PricingService } from './pricing.service.js';

@Global()
@Module({
  controllers: [CatalogController],
  providers: [PricingService],
  exports: [PricingService],
})
export class CatalogModule {}
