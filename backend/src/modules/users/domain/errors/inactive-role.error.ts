export class InactiveRoleError extends Error {
  constructor() {
    super('Role is inactive');
    this.name = 'InactiveRoleError';
  }
}
