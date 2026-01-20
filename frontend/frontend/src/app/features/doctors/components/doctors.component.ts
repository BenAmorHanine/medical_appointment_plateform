import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Doctor } from '../models/doctor.model';
import { DoctorsService } from '../services/doctors.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent implements OnInit {
  // fake data for test 
  doctors: Doctor[] = [
    { id: 1, name: 'Dr. Humour', specialty: 'Cardiology', image: '/assets/images/doctor1.jpg', rating: 4.9, phone: '+216 99 123 456', available: true },
    { id: 2, name: 'Dr. Jenni', specialty: 'Neurology', image: '/assets/images/doctor2.jpg', rating: 4.8, phone: '+216 98 654 321', available: false },
    { id: 3, name: 'Dr. Morco', specialty: 'Pediatrics', image: '/assets/images/doctor3.jpg', rating: 4.9, phone: '+216 97 987 654', available: true },
    { id: 4, name: 'Dr. Sarah', specialty: 'Dermatology', image: '/assets/images/doctor4.jpg', rating: 4.7, phone: '+216 96 111 222', available: true }
  ];

  loading = false;

  constructor(
    private router: Router, 
    private doctorsService: DoctorsService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadRealDoctors(); 
  }

  loadRealDoctors() {
    this.loading = true;
    this.doctorsService.getDoctors().subscribe({
      next: (realDoctors) => {
        this.doctors = [
          ...this.doctors, 
          ...realDoctors.map((d: any) => ({
            id: d.id, 
            name: d.user?.username || d.userId,
            specialty: d.specialty,
            image: '/assets/images/doctor-default.jpg',
            rating: 4.7,
            phone: d.phone || '+216 99 000 000',
            available: true
          }))
        ];
        this.loading = false;
      },
      error: () => {
        console.warn('Backend doctors indisponible, mock only');
        this.loading = false;
      }
    });
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
}
