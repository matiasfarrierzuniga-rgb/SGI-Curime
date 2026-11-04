import { SetMetadata } from '@nestjs/common';
import type { Capability } from '../capabilities/capability-policy';

export const ANY_CAPABILITIES_KEY = 'any-capabilities';

export const RequireAnyCapabilities = (...capabilities: Capability[]) =>
  SetMetadata(ANY_CAPABILITIES_KEY, capabilities);
