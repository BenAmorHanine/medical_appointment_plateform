import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  
  isAuthenticated$ = this.authService.isAuthenticated$;
  showMobileMenu = false;
  isMobile = false;

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  // ✅ MISSING METHODS ADDED
  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleMobileMenu() {  // ← THIS WAS MISSING
    this.showMobileMenu = !this.showMobileMenu;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
