import { Inject, Injectable } from '@nestjs/common';
import { AuthApplicationError } from '../errors/auth.errors';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../ports/auth-repository.port';

@Injectable()
export class UpdateDisplayNameUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepository,
  ) {}

  async execute(
    userId: number,
    displayName: string,
  ): Promise<{ displayName: string }> {
    const updated = await this.repository.updateDisplayName(
      userId,
      displayName,
    );
    if (!updated)
      throw new AuthApplicationError('UNAUTHORIZED', 'Unauthorized');
    return { displayName };
  }
}
