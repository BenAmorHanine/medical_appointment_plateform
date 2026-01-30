import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentService } from './services/appointment.service'; 
import { Appointment } from './models/appointment.interface';
import { AuthService } from '../auth/services/auth.service';
import { PatientService } from '../patients/services/patient.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  appointments: Appointment[] = [];
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
            console.error('Erreur lors du chargement des rendez-vous:', err);
            this.loading = false;
          }
        });
      }
    },
    error: () => this.loading = false
  });
}




  get appointmentList(): any[] {
  return this.appointments.filter(apt => apt.status?.toLowerCase() !== 'cancelled');
}


  getDoctorName(appointment: any): string {
  return appointment.doctorName || 'unknown' ;
}

  getPatientDisplayName(appointment: any): string {
    return appointment.patientName || appointment.patientId?.substring(0, 8) || 'Patient inconnu';
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
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.')) {
      return;
    }
    this.loading = true;
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        // Recharger la liste des rendez-vous
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 'doctor' && currentUser?.id) {
          this.loadDoctorAppointments(currentUser.id);
        } else if (currentUser?.role === 'patient' && currentUser?.id) {
          this.loadPatientAppointments(currentUser.id);
        }
      },
      error: (err) => {
        this.loading = false;
        alert('Erreur lors de l\'annulation du rendez-vous. Veuillez réessayer.');
        console.error('Erreur annulation:', err);
      }
    });
  }

  navigateToConsultation(appointment: any) {
    console.log('Navigation vers consultation avec appointment:', appointment);
    this.router.navigate(['/consultation'], {
      state: { appointment }
    });
  }

  navigateToDetails(appointment: any) {
    // todo
    this.router.navigate(['/appointments'], {
      state: { appointment }
    });
  }

  canCancel(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    return status === 'reserved';
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
