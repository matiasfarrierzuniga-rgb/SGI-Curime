import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, type AuthenticatedUser } from '../../../../auth';
import { InboxNotificationService } from '../../application/inbox-notification.service';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class InboxNotificationsController {
  constructor(private readonly notifications: InboxNotificationService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notifications.list(request.user, query);
  }

  @Get('unread-count')
  unreadCount(@Req() request: AuthenticatedRequest) {
    return this.notifications.unreadCount(request.user.id);
  }

  @Patch('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notifications.markAllRead(request.user.id);
  }

  @Patch(':id/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notifications.markRead(request.user, id);
  }
}
