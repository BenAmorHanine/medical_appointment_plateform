import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentService } from './services/appointment.service'; 
import { Appointment } from './models/appointment.interface';
import { AuthService } from '../auth/services/auth.service';
import { PatientService } from '../patients/services/patient.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private apiUrl = 'http://localhost:3000';

  appointments: Appointment[] = [];
  appointmentsWithPatientNames: Array<Appointment & { patientName?: string }> = [];
  loading = false;

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'doctor') {
      this.loadDoctorAppointments(currentUser.id);
    } else if (currentUser?.role === 'patient') {
      this.loadPatientAppointments(currentUser.id);
    }
  }

  loadPatientAppointments(patientId: string) {
    this.loading = true;
    
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments; 
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  loadDoctorAppointments(userId: string) {
    this.loading = true;
    
    this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${userId}`).subscribe({
      next: (doctorProfile) => {
        if (doctorProfile && doctorProfile.id) {
          this.appointmentService.getAppointmentsByDoctor(doctorProfile.id).subscribe({
            next: (allAppointments) => {
              this.appointments = allAppointments; 
              this.loading = false;
            },
            error: (err) => {
              this.loading = false;
            }
          });
        }
      }
    });
  }

  get appointmentList(): any[] {
  return this.appointments;
}


  getDoctorName(appointment: any): string {
  return appointment.doctorName || 'unknown' ;
}

  get isLoading(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'doctor') {
      return this.loading;
    }
    return this.appointmentService.loading();
  }



  get isDoctor(): boolean {
    return this.authService.getCurrentUser()?.role === 'doctor';
  }

  cancelAppointment(id: string) {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 'doctor' && currentUser?.id) {
          this.loadDoctorAppointments(currentUser.id);
        } else if (currentUser?.role === 'patient' && currentUser?.id) {
          this.loadPatientAppointments(currentUser.id);
        }
      },
      error: (err) => {
        alert('Error canceling appointment');
      }
    });
  }

  canCancel(appointment: any): boolean {
    return appointment.status === 'reserved' || appointment.status === 'RESERVED';
  }

formatAppointmentDate(dateValue: any): string {
  const date = new Date(dateValue.displayDate || dateValue);
  return date.toLocaleDateString('fr-TN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
}
