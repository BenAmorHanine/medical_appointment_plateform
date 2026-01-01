// src/app/features/home/services/home.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
  rating: number;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  image: string;
}

export interface Stat {
  patients: number;
  doctors: number;
  appointments: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  
// fake exemples for now
    
  private stats: Stat = {
    patients: 12500,
    doctors: 350,
    appointments: 45000
  };

  private featuredDoctors: Doctor[] = [
    { id: 1, name: 'Dr. Humour', specialty: 'Cardiology', image: '/assets/images/doctors/doctor1.jpg', rating: 4.9 },
    { id: 2, name: 'Dr. Jenni', specialty: 'Neurology', image: '/assets/images/doctors/doctor2.jpg', rating: 4.8 },
    { id: 3, name: 'Dr. Morco', specialty: 'Pediatrics', image: '/assets/images/doctors/doctor3.jpg', rating: 4.9 },
    { id: 4, name: 'Dr. Sarah', specialty: 'Dermatology', image: '/assets/images/doctors/doctor4.jpg', rating: 4.7 }
  ];

  private testimonials: Testimonial[] = [
    { 
      id: 1, 
      name: 'Morijorch', 
      text: 'Excellent service and professional care. Highly recommended!', 
      image: 'assets/images/testimonials/1.jpg' 
    },
    { 
      id: 2, 
      name: 'Ahmed Ben Ali', 
      text: 'Best medical platform in Tunisia. Easy booking and great doctors!', 
      image: 'assets/images/testimonials/2.jpg' 
    }
  ];

  getStats(): Observable<Stat> {
    return of(this.stats).pipe(delay(500)); // Simulate API delay
  }

  getFeaturedDoctors(): Observable<Doctor[]> {
    return of(this.featuredDoctors).pipe(delay(800));
  }

  getTestimonials(): Observable<Testimonial[]> {
    return of(this.testimonials).pipe(delay(600));
  }

  bookAppointment(data: any): Observable<boolean> {
    // Simulate booking
    return of(true).pipe(delay(2000));
  }
}
