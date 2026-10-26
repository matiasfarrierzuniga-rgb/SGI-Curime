import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { CommunityAccountsService } from './community-accounts.service';
import { CreateCommunityAccountDto } from './dto/create-community-account.dto';
import {
  ResendCommunityVerificationDto,
  VerifyCommunityEmailDto,
} from './dto/community-verification.dto';

@Controller('community-accounts')
export class CommunityAccountsController {
  constructor(private readonly service: CommunityAccountsService) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ThrottlerGuard)
  register(@Body() dto: CreateCommunityAccountDto, @Req() request: Request) {
    return this.service.register(dto, this.context(request));
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  verify(@Body() dto: VerifyCommunityEmailDto, @Req() request: Request) {
    return this.service.verify(dto.token, this.context(request));
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
