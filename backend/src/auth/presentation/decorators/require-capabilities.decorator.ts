import { SetMetadata } from '@nestjs/common';
import type { Capability } from '../capabilities/capability-policy';

export const CAPABILITIES_KEY = 'capabilities';

export const RequireCapabilities = (...capabilities: Capability[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);
