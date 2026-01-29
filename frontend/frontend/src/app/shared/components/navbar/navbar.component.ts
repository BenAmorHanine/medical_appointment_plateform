import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { User } from '../../../features/auth/models/user.model';
import { UserNotificationsService, NotificationDto } from '../../services/user-notifications.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notifService = inject(UserNotificationsService);

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser: User | null = null;

  showMobileMenu = false;
  isMobile = false;

  // 🔔 notifications state
  unreadCount = 0;
  notifications: NotificationDto[] = [];
  showNotifDropdown = false;

  private userSub?: Subscription;

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobileBound);

    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // if logged in -> load user notifications
      if (user) {
        this.refreshUnreadCount();
        // optional: preload list
        this.loadNotifications();
      } else {
        this.unreadCount = 0;
        this.notifications = [];
        this.showNotifDropdown = false;
      }
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkMobileBound);
    this.userSub?.unsubscribe();
  }

  private checkMobileBound = () => this.checkMobile();

  get isDoctor(): boolean {
    return this.currentUser?.role === 'doctor';
  }

  get isPatient(): boolean {
    return this.currentUser?.role === 'patient';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.showMobileMenu = false;
    this.showNotifDropdown = false;
  }

  // ✅ bell dropdown
  toggleNotificationsDropdown() {
    this.showNotifDropdown = !this.showNotifDropdown;

    if (this.showNotifDropdown) {
      this.loadNotifications();
      this.refreshUnreadCount();
    }
  }

  loadNotifications() {
    this.notifService.getMyNotifications().subscribe({
      next: (data) => this.notifications = data,
      error: () => this.notifications = []
    });
  }

  refreshUnreadCount() {
    this.notifService.getMyUnreadCount().subscribe({
      next: (res) => this.unreadCount = res.count,
      error: () => this.unreadCount = 0
    });
  }

  markAllNotificationsRead() {
    this.notifService.markAllRead().subscribe({
      next: () => {
        this.refreshUnreadCount();
        this.loadNotifications();
      }
    });
  }

  markOneAsRead(n: NotificationDto) {
    if (n.read) return;
    this.notifService.markOneRead(n.id).subscribe({
      next: () => {
        n.read = true;
        this.refreshUnreadCount();
      }
    });
  }

  // keep your old navigation if you want a full page later
  goToNotifications() {
    this.router.navigate(['/notifications']);
    this.showMobileMenu = false;
    this.showNotifDropdown = false;
  }
}
