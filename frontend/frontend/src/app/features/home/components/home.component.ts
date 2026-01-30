import { Component, inject, OnInit ,OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DoctorsService } from '../../doctors/services/doctors.service';
import { Doctor } from '../../doctors/models/doctor.model';
import { Subject, takeUntil } from 'rxjs';

interface Testimonial {
  id: number;
  name: string;
  text: string;
}

interface Stat {
  patients: number;
  doctors: number;
  appointments: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  authService = inject(AuthService);
  router = inject(Router);
  doctorsService = inject(DoctorsService);

  stats: Stat = {
    patients: 12500,
    doctors: 350,
    appointments: 45000
  };

  isAuthenticated$ = this.authService.isAuthenticated$;

  featuredDoctors: Doctor[] = [];
  loadingDoctors = true;

  testimonials: Testimonial[] = [
    { id: 1, name: 'Morijorch', text: 'Excellent service.' },
    { id: 2, name: 'Ahmed Ben Ali', text: 'Best platform.' },
    { id: 3, name: 'Fatma Trabelsi', text: 'Great doctors.' }
  ];

  ngOnInit() {
    this.loadFeaturedDoctors();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeaturedDoctors() {
    this.loadingDoctors = true;
    this.doctorsService.getFeaturedDoctors().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (doctors) => {
        this.featuredDoctors = doctors;
        this.loadingDoctors = false;
      },
      error: () => {
        this.loadingDoctors = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getDoctorImage(doctor: Doctor): string {
    return doctor.image || '/assets/images/default-doctor.jpg';
  }

  getDoctorName(doctor: Doctor): string {
  return doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}`.trim() : 'Doctor';
  }


  viewDoctor(doctor: Doctor) {
    this.router.navigate(['/doctor', doctor.id]);
  }

  trackByDoctor(index: number, doctor: Doctor): number {
    return doctor.id;
  }

  goToMyHistory(): void {
  const user = this.authService.getCurrentUser();

  if (!user) {
    this.router.navigate(['/auth/login']);
    return;
  }

  if (user.role === 'doctor') {
    // 👨‍⚕️ Liste des patients du médecin
    this.router.navigate(['/history/doctor']);
  } else {
    // 👤 Historique du patient
    this.router.navigate(['/history']);
    // ou '/history/me' selon ta config
  }
}


get isDoctor(): boolean {
  const user = this.authService.getCurrentUser();
  return user?.role === 'doctor';
}


goToSendNotification(): void {
  this.router.navigate(['/doctor/send-notification']);
}

}
