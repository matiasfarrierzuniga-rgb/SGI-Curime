import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

/** Default-deny guard for operations without an approved canonical capability. */
@Injectable()
export class UnsupportedOperationGuard implements CanActivate {
  canActivate(_context: ExecutionContext): false {
    throw new ForbiddenException('This operation is not available.');
  }
}
