import { Module } from '@nestjs/common';
import { RuntimePersonResolverService } from './runtime-person-resolver.service';

@Module({
  providers: [RuntimePersonResolverService],
  exports: [RuntimePersonResolverService],
})
export class IdentityModule {}
