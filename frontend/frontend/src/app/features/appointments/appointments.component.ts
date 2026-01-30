import { Component, inject, OnInit ,signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentService } from './services/appointment.service'; 
import { Appointment } from './models/appointment.interface';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  selectedFile: File | null = null;
  patientNote = signal(''); 
  selectedAppointment: any = null;
  tempNote: string = '';

  appointmentList = computed(() => 
    this.appointments().filter(apt => apt.status?.toLowerCase() !== 'cancelled')
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'doctor') {
      this.loadDoctorAppointments(currentUser.id);
    } else if (currentUser?.role === 'patient') {
      this.loadPatientAppointments(currentUser.id);
    }
  }

  loadPatientAppointments(patientId: string) {
    this.loading.set(true);
    this.appointmentService.getAppointmentsByPatient(patientId).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => this.appointments.set(data),
      error: () => this.appointments.set([])
    });
  }

loadDoctorAppointments(userId: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${userId}`).subscribe({
      next: (doctorProfile) => {
        if (doctorProfile?.id) {
          this.appointmentService.getAppointmentsByDoctor(doctorProfile.id).pipe(
            finalize(() => this.loading.set(false))
          ).subscribe({
            next: (data) => this.appointments.set(data),
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  get isDoctor(): boolean {
    return this.authService.getCurrentUser()?.role === 'doctor';
  }

  getDoctorName(appointment: any): string {
  return appointment.doctorName || 'unknown' ;
}

  getPatientDisplayName(appointment: any): string {
    return appointment.patientName || appointment.patientId?.substring(0, 8) || 'Patient unknown';
  }


isLoading = computed(() => {
  const currentUser = this.authService.getCurrentUser();
  if (currentUser?.role === 'doctor') {
    return this.loading(); 
  }
  return this.appointmentService.loading(); 
});



cancelAppointment(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    this.loading.set(true);
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => this.loadData(),
      error: () => this.loading.set(false)
    });
  }

  navigateToConsultation(appointment: any) {
    console.log('Navigation vers consultation avec appointment:', appointment);
    this.router.navigate(['/consultation'], {
      state: { appointment }
    });
  }


  canCancel(appointment: any): boolean {
    const status = appointment.status?.toLowerCase();
    return status === 'reserved';
  }

formatAppointmentDate(dateValue: any): string {
  const date = new Date(dateValue.displayDate || dateValue);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}


onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

openPreparationModal(appointment: any) {
  this.selectedAppointment = appointment;
  this.tempNote = appointment.patientNote || ''; 
}

savePreparation() {
  if (!this.selectedAppointment) return;

  const formData = new FormData();
  formData.append('patientNote', this.tempNote); 
  if (this.selectedFile) {
    formData.append('file', this.selectedFile);
  }

  this.loading.set(true);

  this.http.patch(`${this.apiUrl}/appointments/${this.selectedAppointment.id}`, formData)
    .subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedAppointment = null; 
        this.selectedFile = null; 
        this.loadData(); 
        alert('saved successfully!'); 
      },
      error: () => {
        this.loading.set(false);
        alert('Error saving changes.');
      }
    });
}

viewingPatientAppointment: any = null;

openPatientInfoModal(appointment: any) {
  this.viewingPatientAppointment = appointment;
}
}
