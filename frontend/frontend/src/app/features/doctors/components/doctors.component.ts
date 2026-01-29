import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Doctor } from '../models/doctor.model';
import { DoctorsService } from '../services/doctors.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = true;
  selectedDoctor: Doctor | null = null;

  router = inject(Router);
  doctorsService = inject(DoctorsService);
  authService = inject(AuthService);

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading = true;
    this.doctorsService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  refreshDoctors() {
    this.doctorsService.refresh();
    this.loadDoctors();
  }

  /*viewProfile(doctor: Doctor) {
    this.router.navigate(['/doctor', doctor.id]);
  }*/

  bookNow(doctor: Doctor) {
    if (!this.authService.isAuthenticated()) {
    this.router.navigate(['/auth/login']);
    window.scrollTo(0, 0);
    return;
  }
  sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
  this.router.navigate(['/book']);
  window.scrollTo(0, 0);
}


  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  /*getDoctorImage(doctor: Doctor): string {
    return doctor.image || '/assets/images/default-doctor.jpg';
  }*/

  getDoctorImage(doctor: Doctor | null): string {
  if (!doctor || !doctor.image) {
    return 'assets/images/default-doctor.jpg';
  }
  return doctor.image.startsWith('uploads/')
    ? `http://localhost:3000/${doctor.image}`
    : doctor.image;
}

  viewProfile(doctor: Doctor) {
    this.selectedDoctor = doctor;
    window.scrollTo(0, 0);
  }

  closeProfile() {
    this.selectedDoctor = null;
  }


}
