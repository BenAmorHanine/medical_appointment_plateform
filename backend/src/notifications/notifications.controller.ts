import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,  // ← AJOUTE
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  getUserNotifications(@GetUser() user: any) {  // ✅ user complet
    const userId = user.sub || user.userId;    // ✅ Extrait ID
    console.log('🔍 Extracted userId:', userId);
    return this.service.findByUser(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@GetUser() user: any) {  // ✅ Fix
    const userId = user.sub || user.userId;
    const count = await this.service.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markRead(@Param('id') id: string, @GetUser() user: any) {  // ✅ Fix
    const userId = user.sub || user.userId;
    return this.service.markRead(id, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllRead(@GetUser() user: any) {  // ✅ Fix
    const userId = user.sub || user.userId;
    return this.service.markAllRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  deleteNotification(@Param('id') id: string, @GetUser() user: any) {  // ✅ Fix
    const userId = user.sub || user.userId;
    return this.service.deleteNotification(id, userId);
  }
}
