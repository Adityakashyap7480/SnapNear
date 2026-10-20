import { Module } from '@nestjs/common';
import { MailService } from '../auth/mail.service.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { PayoutsService } from './payouts.service.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PayoutsService, MailService],
})
export class AdminModule {}
