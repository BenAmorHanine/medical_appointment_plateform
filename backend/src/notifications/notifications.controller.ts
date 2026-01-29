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
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';


@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  getUserNotifications(@GetUser() user: any) {
  console.log('JWT user object =', user);
  console.log('sub =', user?.sub);
  console.log('userId =', user?.userId);
  console.log('id =', user?.id);

  const userId = user?.sub || user?.userId || user?.id;
  console.log('EXTRACTED userId =', userId);

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
    // ✅ ADMIN: list ALL notifications (no userId filter)
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllNotificationsForAdmin() {
    return this.service.findAllForAdmin();
  }

  // ✅ ADMIN: unread count for ALL notifications
  @Get('admin/unread-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUnreadCountForAdmin() {
    const count = await this.service.getUnreadCountForAdmin();
    return { count };
  }

  // ✅ ADMIN: mark ALL notifications as read
  @Patch('admin/mark-all-read')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  markAllReadForAdmin() {
    return this.service.markAllReadForAdmin();
  }

}
