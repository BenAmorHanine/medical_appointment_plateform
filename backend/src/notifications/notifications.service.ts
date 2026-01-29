import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private repo: Repository<NotificationEntity>,
  ) {}

  async findByUser(userId: string) {
  console.log('🔍 Service cherche userId:', userId);
  
  const result = await this.repo.find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });

  console.log('✅ Found notifications:', result.length);
  return result;
}


  async markRead(id: string, userId: string) {
    const notification = await this.repo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return this.repo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, read: false }, { read: true });
    return { message: 'All notifications marked as read' };
  }

  async createForUser(userId: string, title: string, message: string) {
    const notification = this.repo.create({
      userId,
      title,
      message,
    });
    return this.repo.save(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, read: false },
    });
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.repo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.repo.remove(notification);
    return { message: 'Notification deleted' };
  }
  async findAllForAdmin() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCountForAdmin(): Promise<number> {
    return this.repo.count({ where: { read: false } });
  }

  async markAllReadForAdmin() {
    await this.repo.update({ read: false }, { read: true });
    return { message: 'All notifications marked as read (admin)' };
  }

}