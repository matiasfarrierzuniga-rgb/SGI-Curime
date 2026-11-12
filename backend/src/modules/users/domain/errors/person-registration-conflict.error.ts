export type PersonRegistrationConflictCode =
  | 'INVALID_IDENTITY'
  | 'IDENTITY_CONFLICT'
  | 'IDENTITY_DUPLICATE_CORRUPTION'
  | 'PROFILE_ENRICHMENT_REQUIRED'
  | 'PERSON_ALREADY_HAS_USER'
  | 'PERSON_IDENTITY_RACE';

const MESSAGES: Record<PersonRegistrationConflictCode, string> = {
  INVALID_IDENTITY:
    'La identidad no cumple las reglas de identificación institucional.',
  IDENTITY_CONFLICT:
    'La identificación ya existe con un nombre incompatible. Revise la Persona existente.',
  IDENTITY_DUPLICATE_CORRUPTION:
    'Existen múltiples Personas con la misma identificación. Se requiere revisión manual.',
  PROFILE_ENRICHMENT_REQUIRED:
    'La Persona existente requiere revisión manual antes de reutilizarse.',
  PERSON_ALREADY_HAS_USER: 'La Persona ya está vinculada a una cuenta SGI.',
  PERSON_IDENTITY_RACE:
    'No fue posible resolver la identidad por concurrencia. Intente nuevamente.',
};

export class PersonRegistrationConflictError extends Error {
  constructor(public readonly code: PersonRegistrationConflictCode) {
    super(MESSAGES[code]);
    this.name = 'PersonRegistrationConflictError';
  }
}
