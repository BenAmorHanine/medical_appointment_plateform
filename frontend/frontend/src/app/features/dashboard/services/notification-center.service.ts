// src/app/features/dashboard/services/notification-center.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private baseUrl = 'http://localhost:3000/notifications'; // same remark as above

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.baseUrl);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  markAllRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/mark-all-read`,
      {},
    );
  }
}
