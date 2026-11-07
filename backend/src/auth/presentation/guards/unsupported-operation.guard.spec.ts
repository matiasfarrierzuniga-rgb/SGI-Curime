import { ForbiddenException } from '@nestjs/common';
import { UnsupportedOperationGuard } from './unsupported-operation.guard';

describe('UnsupportedOperationGuard', () => {
  it('denies unsupported operations by default', () => {
    const guard = new UnsupportedOperationGuard();

    expect(() => guard.canActivate({} as never)).toThrow(ForbiddenException);
  });
});
