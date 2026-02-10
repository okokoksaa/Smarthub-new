import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthenticatedUser } from '../auth/guards/supabase-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications(
    @Request() req: { user: AuthenticatedUser },
    @Query('limit') limit?: number,
  ) {
    const notifications = await this.notificationsService.getUserNotifications(
      req.user.id,
      limit || 50,
    );
    return { notifications };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@Request() req: { user: AuthenticatedUser }) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: { user: AuthenticatedUser }) {
    const notifications = await this.notificationsService.getUserNotifications(req.user.id);
    await Promise.all(
      notifications
        .filter((n) => !n.is_read)
        .map((n) => this.notificationsService.markAsRead(n.id, req.user.id)),
    );
    return { success: true };
  }
}
