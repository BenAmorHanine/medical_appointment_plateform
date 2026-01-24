import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../features/auth/services/auth.service';
import { User } from '../../../features/auth/models/user.model';

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

  isAuthenticated$ = this.authService.isAuthenticated$;
  currentUser: User | null = null;

  showMobileMenu = false;
  isMobile = false;

  private userSub?: Subscription;

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobileBound);

    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
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
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
    this.showMobileMenu = false;
  }
}
