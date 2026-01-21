import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Doctor } from '../../doctors/models/doctor.model';
import { DoctorsService } from '../../doctors/services/doctors.service';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = true;

  router = inject(Router);
  doctorsService = inject(DoctorsService);

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

  viewProfile(doctor: Doctor) {
    this.router.navigate(['/doctor', doctor.id]);
  }

  bookNow(doctor: Doctor) {
    this.router.navigate(['/book', doctor.id]);
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getDoctorImage(doctor: Doctor): string {
    return doctor.image || '/assets/images/default-doctor.jpg';
  }
}
