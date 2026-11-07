import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { CorrectCommunityEmailDto } from './dto/correct-community-email.dto';
import { CommunityAccountsService } from './community-accounts.service';
import { CreateCommunityAccountDto } from './dto/create-community-account.dto';
import {
  ResendCommunityVerificationDto,
  VerifyCommunityEmailDto,
  CompleteCommunityActivationDto,
} from './dto/community-verification.dto';

@Controller('community-accounts')
export class CommunityAccountsController {
  constructor(private readonly service: CommunityAccountsService) {}

  @Post(':id/correct-email')
  @RequireCapabilities('usr.users.update')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  correctEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectCommunityEmailDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.service.correctEmail(
      id,
      dto,
      request.user.id,
      this.context(request),
    );
  }

  @Post(':id/reverify')
  @RequireCapabilities('usr.users.lifecycle.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  reverify(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.service.reverifyHistorical(
      id,
      request.user.id,
      this.context(request),
    );
  }

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ThrottlerGuard)
  register(@Body() dto: CreateCommunityAccountDto, @Req() request: Request) {
    return this.service.register(dto, this.context(request));
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  verify(@Body() dto: CompleteCommunityActivationDto, @Req() request: Request) {
    return this.service.verify(
      dto.token,
      this.context(request),
      dto.password,
      dto.passwordConfirmation,
    );
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  validateToken(@Body() dto: VerifyCommunityEmailDto) {
    return this.service.validateToken(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ThrottlerGuard)
  resend(@Body() dto: ResendCommunityVerificationDto) {
    return this.service.resend(dto.email);
  }

  private context(request: Request) {
    return { ipAddress: request.ip, userAgent: request.get('user-agent') };
  }
}
