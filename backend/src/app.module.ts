import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { CatalogController } from './catalog/catalog.controller.js';
import { CreatorModule } from './creator/creator.module.js';
import { FallbackModule } from './fallback/fallback.controller.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { RepositoriesModule } from './repositories/repositories.module.js';

@Module({
  imports: [
    RepositoriesModule,
    NotificationsModule,
    RealtimeModule,
    AuthModule,
    BookingsModule,
    CreatorModule,
    PaymentsModule,
    AdminModule,
    FallbackModule,
  ],
  controllers: [CatalogController],
})
export class AppModule {}
