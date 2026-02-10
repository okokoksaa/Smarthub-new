import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationsDto } from './dto';
import { Notification } from '@shared/database';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and send notification(s)' })
  @ApiResponse({
    status: 201,
    description: 'Notification(s) created and queued for sending',
    type: [Notification],
  })
  async create(
    @Body() createDto: CreateNotificationDto,
  ): Promise<Notification[]> {
    return this.notificationsService.createNotification(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findAll(
    @Query() queryDto: QueryNotificationsDto,
    @Req() req: any,
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.getUserNotifications(userId, queryDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@Req() req: any): Promise<{ count: number }> {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.notificationsService.getUserNotifications(userId, {
      unreadOnly: true,
      limit: 1,
    });
    return { count: result.unreadCount };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Req() req: any): Promise<any> {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.getStatistics(userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Req() req: any): Promise<{ updated: number }> {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<Notification> {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification queued for retry',
  })
  async retry(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.notificationsService.retryNotification(id);
    return { message: 'Notification queued for retry' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user?.id || req.user?.sub;
    await this.notificationsService.deleteNotification(id, userId);
    return { message: 'Notification deleted successfully' };
  }
}
