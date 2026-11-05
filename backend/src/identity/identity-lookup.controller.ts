import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IdentityLookupService } from './identity-lookup.service';

@Controller('identity')
export class IdentityLookupController {
  constructor(private readonly identityLookup: IdentityLookupService) {}

  @Get('lookup/:identification')
  @UseGuards(ThrottlerGuard)
  @Header('Cache-Control', 'no-store')
  lookup(@Param('identification') identification: string) {
    return this.identityLookup.lookup(identification);
  }
}
