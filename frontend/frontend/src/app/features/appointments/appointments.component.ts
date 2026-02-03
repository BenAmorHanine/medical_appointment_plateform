import { Component, inject, OnInit ,signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink,  Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentService } from './services/appointment.service'; 
import { Appointment } from './models/appointment.interface';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../patients/services/patient.service'; 
import { DoctorsService } from '../doctors/services/doctors.service';
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
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorsService);
  //private apiUrl = environment.apiUrl;

  appointments = signal<Appointment[]>([]);
  loading = signal(false);
  selectedFile: File | null = null;

  patientNote = signal(''); 

  selectedAppointment = signal<Appointment | null>(null);
  viewingPatientAppointment = signal<Appointment | null>(null);
  tempNote = '';
  
  appointmentList = computed(() => 
    this.appointments().filter(apt => apt.status?.toLowerCase() !== 'cancelled')
  );

  ngOnInit() {
    this.loadData();
  }



loadData() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id) return;

    this.loading.set(true);

    if (user.role === 'patient') {
      this.patientService.getByUserId(user.id).subscribe({
        next: (profile) => this.fetchAppointments(profile.id, 'patient'),
        error: () => this.loading.set(false)
      });
        }  else if (user.role === 'doctor') {
      this.doctorService.getByUserId(user.id).subscribe({
        next: (profile) => {
          if (profile) {
            this.fetchAppointments(String(profile.id), 'doctor');
          } else {
            this.loading.set(false);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }


  private fetchAppointments(profileId: string, role: string) {
    this.appointmentService.getAppointmentsByRole(profileId, role)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.appointments.set(data);
          console.log('Rendez-vous affichés !', data);
        },
        error: (err) => {
          console.error("Erreur de chargement des rendez-vous", err);
          this.appointments.set([]);
        }
      });
  }

  cancelAppointment(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    this.loading.set(true);
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => this.loadData(),
      error: () => this.loading.set(false)
    });
  }
  

  savePreparation() {
    const apt = this.selectedAppointment();
    if (!apt) return;

    const formData = new FormData();
    formData.append('patientNote', this.tempNote); 
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.loading.set(true);
    this.appointmentService.updateAppointmentDetails(apt.id, formData).subscribe({
      next: () => {
        this.selectedAppointment.set(null);
        this.selectedFile = null;
        this.loadData();
        alert('Saved successfully!');
      },
      error: () => {
        this.loading.set(false);
        alert('Error saving changes.');
      }
    });
  }

  get isDoctor(): boolean {
    return this.authService.getCurrentUser()?.role === 'doctor';
  }

  getDoctorName(appointment: any): string {
    const user = appointment?.doctor?.user;
    if (!user) return 'Doctor unknown';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }

  getPatientDisplayName(appointment:any): string {
    const user = appointment?.patient?.user;
    if (!user) return 'Patient unknown';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }

  navigateToConsultation(appointment: Appointment) {
    console.log('Navigation vers consultation avec appointment:', appointment);
    this.router.navigate(['/consultation'], {
      state: { appointment }
    });
  }

  canCancel(appointment: Appointment): boolean {
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

  openPreparationModal(appointment: Appointment) {
    this.selectedAppointment.set(appointment);
    this.tempNote = appointment.patientNote || ''; 
  }
  openPatientInfoModal(appointment: Appointment) {
    this.viewingPatientAppointment.set(appointment);
  }
}
