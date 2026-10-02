import { SetMetadata } from '@nestjs/common';
import type { Capability } from '../capabilities/capability-policy';

export const CAPABILITY_BY_BODY_VALUE_KEY = 'capabilityByBodyValue';

export interface CapabilityByBodyValueRequirement {
  field: string;
  capabilities: Readonly<Record<string, Capability>>;
}

export const RequireCapabilityByBodyValue = (
  field: string,
  capabilities: Readonly<Record<string, Capability>>,
) =>
  SetMetadata<
    string,
    CapabilityByBodyValueRequirement
  >(CAPABILITY_BY_BODY_VALUE_KEY, { field, capabilities });
