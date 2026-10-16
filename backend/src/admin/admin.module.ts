import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { PayoutsService } from './payouts.service.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PayoutsService],
})
export class AdminModule {}
