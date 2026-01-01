import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DoctorsService } from '../services/doctors.service';
import { Doctor } from '../models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = true;

  constructor(
    private doctorsService: DoctorsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.doctorsService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.loading = false;
      }
    });
  }

  viewProfile(doctor: Doctor) {
    this.router.navigate(['/doctors', doctor.id]);
  }

  bookNow(doctor: Doctor) {
    this.router.navigate(['/book', doctor.id]);
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}
