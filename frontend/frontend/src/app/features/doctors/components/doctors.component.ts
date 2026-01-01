import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Doctor } from '../models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss']
})
export class DoctorsComponent {
  // fake data for test 
  doctors: Doctor[] = [
    { id: 1, name: 'Dr. Humour', specialty: 'Cardiology', image: '/assets/images/doctor1.jpg', rating: 4.9, phone: '+216 99 123 456', available: true },
    { id: 2, name: 'Dr. Jenni', specialty: 'Neurology', image: '/assets/images/doctor2.jpg', rating: 4.8, phone: '+216 98 654 321', available: false },
    { id: 3, name: 'Dr. Morco', specialty: 'Pediatrics', image: '/assets/images/doctor3.jpg', rating: 4.9, phone: '+216 97 987 654', available: true },
    { id: 4, name: 'Dr. Sarah', specialty: 'Dermatology', image: '/assets/images/doctor4.jpg', rating: 4.7, phone: '+216 96 111 222', available: true }
  ];

  constructor(private router: Router) {}

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
