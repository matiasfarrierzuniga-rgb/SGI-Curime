import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { AuditController } from './audit.controller';

describe('AuditController', () => {
  it('protects audit-log queries with the persisted audit capability', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuditController)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, AuditController)).toEqual([
      'aud.logs.read',
    ]);
  });
});
