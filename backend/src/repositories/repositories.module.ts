import { Global, Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { BookingsRepository } from './bookings.repository.js';
import { UsersRepository } from './users.repository.js';

@Global()
@Module({
  providers: [DatabaseService, UsersRepository, BookingsRepository],
  exports: [DatabaseService, UsersRepository, BookingsRepository],
})
export class RepositoriesModule {}
