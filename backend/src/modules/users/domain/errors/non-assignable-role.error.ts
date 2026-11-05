export class NonAssignableRoleError extends Error {
  constructor() {
    super('Role is not part of the canonical assignable catalog');
    this.name = 'NonAssignableRoleError';
  }
}
