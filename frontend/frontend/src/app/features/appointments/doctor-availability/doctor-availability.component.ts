import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../services/availability.service';
import { Availability } from '../models/availability.interface';
import { AuthService } from '../../auth/services/auth.service';


@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.css'],
})
export class DoctorAvailabilityComponent implements OnInit {
  private availabilityService = inject(AvailabilityService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000';


  availabilities: Availability[] = [];
  loading = false;
  error: string | null = null;


  selectedDate = '';
  startTime = '';
  endTime = '';
  capacity = 1;


  doctorProfileId: string | null = null;


ngOnInit() {
  const currentUser = this.authService.getCurrentUser();
  if (currentUser?.role === 'doctor') {
    this.loadDoctorAvailabilities(currentUser.id);
  }
}

loadDoctorAvailabilities(userId: string) {
  this.loading = true;


  this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${userId}`).subscribe({
    next: (doctorProfile) => { 
      if (doctorProfile?.id) {
        this.doctorProfileId = doctorProfile.id;

        
        this.availabilityService.loadAvailabilitiesForDoctor(this.doctorProfileId!).subscribe({
          next: (availabilities) => {
            this.availabilities = availabilities || [];
            this.loading = false;
          },
          error: (err) => {
            console.error(' Erreur slots:', err);
            this.error = 'Aucun créneau trouvé';
            this.loading = false;
          }
        });
      } else {
        console.warn(' Profil médecin non trouvé');
        this.error = 'Profil médecin introuvable';
        this.loading = false;
      }
    },
    error: (err) => {
      this.error = `Erreur API: ${err.status}`;
      this.loading = false;
    }
  });
}

get hasAvailabilities(): boolean {
  return this.availabilities.length > 0;
}

trackById(_index: number, slot: Availability): string {
  return slot.id;
}

addSlot() {
  if (!this.selectedDate || !this.startTime || !this.endTime || !this.doctorProfileId) {
    this.error = 'Please fill all fields';
    return;
  }

  const dto = {
    doctorId: this.doctorProfileId,
    date: this.selectedDate,
    startTime: this.startTime,
    endTime: this.endTime,
    capacity: this.capacity,
  };

  this.loading = true;
  this.availabilityService.createAvailability(dto).subscribe({
    next: (created) => {
      this.availabilities.unshift(created);
      this.selectedDate = '';
      this.startTime = '';
      this.endTime = '';
      this.capacity = 1;
      this.loading = false;
    },
    error: (err: any) => {
      this.error = err?.error?.message || 'Failed to create slot';
      this.loading = false;
    }
  });
}

resetForm() {
  this.selectedDate = '';
  this.startTime = '';
  this.endTime = '';
  this.capacity = 1;
}

deleteSlot(slotId: string) {
  this.loading = true;
  this.availabilityService.deleteAvailability(slotId).subscribe({
    next: () => {
      this.availabilities = this.availabilities.filter(s => s.id !== slotId);
      this.loading = false;
    }
  });
}
}