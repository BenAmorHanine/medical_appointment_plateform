import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
  rating: number;
}

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
export class HomeComponent {

  authService = inject(AuthService);
  router = inject(Router);
  
  isAuthenticated$ = this.authService.isAuthenticated$;

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

// fake exemples for now

  stats: Stat = {
    patients: 12500,
    doctors: 350,
    appointments: 45000
  };


  featuredDoctors: Doctor[] = [
    { id: 1, name: 'Dr. Humour', specialty: 'Cardiology',  image: '/assets/images/doctor1.jpg', rating: 4.9 },
    { id: 2, name: 'Dr. Jenni',  specialty: 'Neurology',   image: '/assets/images/doctor2.jpg', rating: 4.8 },
    { id: 3, name: 'Dr. Morco',  specialty: 'Pediatrics',  image: '/assets/images/doctor3.jpg', rating: 4.9 },
    { id: 4, name: 'Dr. Sarah',  specialty: 'Dermatology', image: '/assets/images/doctor4.jpg', rating: 4.7 }
  ];

  testimonials: Testimonial[] = [
    { id: 1, name: 'Morijorch',      text: 'Excellent service and professional care. Highly recommended!' },
    { id: 2, name: 'Ahmed Ben Ali',  text: 'Best medical platform in Tunisia. Easy to use and very reliable.' },
    { id: 3, name: 'Fatma Trabelsi', text: 'Clean design, clear information and great doctors.' }
  ];

  getDoctorImage(doctor: Doctor): string {
    return doctor.image || '../assets/images/default-doctor.jpg';
  }
}
