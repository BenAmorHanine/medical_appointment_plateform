// src/app/features/dashboard/components/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { NotificationCenterService } from '../services/notification-center.service';
// Adjust this import path to your real AuthService location
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  stats: any | null = null;
  users: any[] = [];
  notifications: any[] = [];
  unreadCount = 0;

  loadingStats = false;
  loadingUsers = false;
  loadingNotifications = false;
  error: string | null = null;

  private dashboardService = inject(DashboardService);
  private notificationService = inject(NotificationCenterService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser?.(); // adjust to your actual API
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.loadStats();
    this.loadUsers();
    this.loadNotifications();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loadingStats = false;
      },
      error: () => {
        this.error = 'Failed to load stats';
        this.loadingStats = false;
      },
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.dashboardService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loadingUsers = false;
      },
    });
  }

  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loadingNotifications = false;
      },
      error: () => {
        this.loadingNotifications = false;
      },
    });

    this.notificationService.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount = res.count;
      },
    });
  }

  onChangeRole(user: any, newRole: string): void {
    if (user.role === newRole) return;
    this.dashboardService.changeUserRole(user.id, newRole).subscribe({
      next: (updated) => {
        user.role = updated.role;
      },
    });
  }

  onDeleteUser(user: any): void {
    if (!confirm(`Delete user ${user.username}?`)) return;
    this.dashboardService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
    });
  }

  onMarkAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.loadNotifications(),
    });
  }
}
