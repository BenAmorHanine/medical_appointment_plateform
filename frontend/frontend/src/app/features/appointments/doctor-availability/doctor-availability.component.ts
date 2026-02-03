import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../services/availability.service';
import { Availability } from '../models/availability.interface';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';


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
  private apiUrl = environment.apiUrl;


  availabilities: Availability[] = [];
  loading = false;
  error: string | null = null;
  doctorProfileId: string | null = null;

  selectedDate = '';
  startTime = '';
  endTime = '';
  capacity = 1;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
      const user = this.authService.getCurrentUser();
      if (user?.role !== 'doctor') return;

      this.loading = true;
      this.availabilityService.getDoctorProfile(user.id).subscribe({
        next: (profile) => {
          this.doctorProfileId = profile.id;
          this.refreshSlots();
        },
        error: () => {
          this.error = 'Doctor profile not found';
          this.loading = false;
        }
      });
    }

  refreshSlots() {
    if (!this.doctorProfileId) return;
    this.availabilityService.getAvailabilitiesByUserId(this.authService.getCurrentUser()!.id).subscribe({
      next: (data) => {
        this.availabilities = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No slots found';
        this.loading = false;
      }
    });
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
        this.resetForm();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to create slot';
        this.loading = false;
      }
    });
  }

  private resetForm() {
      this.selectedDate = '';
      this.startTime = '';
      this.endTime = '';
      this.capacity = 1;
      this.error = null;
    }

  deleteSlot(slotId: string) {
      if (!confirm('Are you sure you want to delete this slot?')) return;

      this.loading = true;
      this.availabilityService.deleteAvailability(slotId).subscribe({
        next: () => {
          this.availabilities = this.availabilities.filter(s => s.id !== slotId);
          this.loading = false;
        },
        error: () => {
          this.error = 'Could not delete slot';
          this.loading = false;
        }
      });
    }

  get hasAvailabilities(): boolean {
      return this.availabilities.length > 0;
    }


}