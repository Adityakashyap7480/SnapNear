import { All, Controller, Module, NotFoundException } from '@nestjs/common';
import { Auth } from '../auth/auth.guard.js';
import { ROLES } from '../constants/roles.js';

/**
 * Unknown paths under a protected area still require that area's login before answering 404.
 * Must be registered after every feature module so it never shadows a real route.
 */
@Controller()
export class FallbackController {
  @All('bookings{/*path}')
  @Auth(ROLES.CLIENT)
  bookings(): never {
    throw new NotFoundException();
  }

  @All('creator{/*path}')
  @Auth(ROLES.CREATOR)
  creator(): never {
    throw new NotFoundException();
  }

  @All('admin{/*path}')
  @Auth(ROLES.SUPER_ADMIN)
  admin(): never {
    throw new NotFoundException();
  }
}

@Module({ controllers: [FallbackController] })
export class FallbackModule {}
