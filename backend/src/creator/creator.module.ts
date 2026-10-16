import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module.js';
import { CreatorController } from './creator.controller.js';
import { CreatorService } from './creator.service.js';

@Module({
  imports: [PaymentsModule],
  controllers: [CreatorController],
  providers: [CreatorService],
})
export class CreatorModule {}
