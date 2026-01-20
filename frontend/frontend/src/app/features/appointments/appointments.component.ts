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
      console.log(' Patient RDV:', appointments);
      this.appointments = appointments; 
      console.log(' Patient appointments:', this.appointments.length);
      this.loading = false;
    },
    error: (err) => {
      console.error('Error:', err);
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
            console.log(' TOUS RDV:', allAppointments);
            
            
            this.appointments = allAppointments; 
            
            console.log(' Appointments loaded:', this.appointments.length);
            this.loadPatientNames();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error:', err);
            this.loading = false;
          }
        });
      }
    }
  });
}


get appointmentList(): Appointment[] {
  const currentUser = this.authService.getCurrentUser();
  
  console.log('🔍 appointmentList - role:', currentUser?.role, 'count:', this.appointments.length);
  
  return this.appointments;
}

getDoctorName(appointment: any): string {
  // Récupère nom docteur depuis availability ou fixe temporairement
  return appointment.availability?.doctor?.user?.name || 'Nermine';
}



  get isLoading(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'doctor') {
      return this.loading;
    }
    return this.appointmentService.loading();
  }

  loadPatientNames(): void {
    this.appointmentsWithPatientNames = [];
    this.appointments.forEach(appointment => {
      this.patientService.getPatientName(appointment.patientId).subscribe({
        next: (patientName) => {
          this.appointmentsWithPatientNames.push({
            ...appointment,
            patientName: patientName
          });
        },
        error: () => {
          this.appointmentsWithPatientNames.push({
            ...appointment,
            patientName: `Patient ${appointment.patientId.substring(0, 8)}...`
          });
        }
      });
    });
  }

  getPatientName(patientId: string): string {
    const appointment = this.appointmentsWithPatientNames.find(a => a.patientId === patientId);
    return appointment?.patientName || `Patient ${patientId.substring(0, 8)}...`;
  }

  get isDoctor(): boolean {
    return this.authService.getCurrentUser()?.role === 'doctor';
  }

cancelAppointment(id: string) {
  this.appointmentService.cancelAppointment(id).subscribe({
    next: () => {
      console.log(' RDV annulé:', id);
      
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.role === 'doctor' && currentUser?.id) {
        this.loadDoctorAppointments(currentUser.id);
      } else if (currentUser?.role === 'patient' && currentUser?.id) {
        this.loadPatientAppointments(currentUser.id);
      }
    },
    error: (err) => {
      console.error(' Erreur annulation:', err);
      alert('Erreur lors de l\'annulation');
    }
  });
}


  canCancel(appointment: any): boolean {
  return appointment.status === 'reserved' || appointment.status === 'RESERVED';
}

formatAppointmentDate(dateValue: any): string {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue);
  
  return date.toLocaleDateString('fr-TN', {
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    timeZone: 'Africa/Tunis'
  });
}



}
