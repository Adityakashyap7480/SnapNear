import { Module } from '@nestjs/common';
import { MailService } from '../auth/mail.service.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { CreatorController } from './creator.controller.js';
import { CreatorService } from './creator.service.js';

@Module({
  imports: [PaymentsModule],
  controllers: [CreatorController],
  providers: [CreatorService, MailService],
})
export class CreatorModule {}
