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
      // Load appointments for doctor - filter to today's appointments
      this.loadDoctorAppointments(currentUser.id);
    } else {
      // Patient flow (though this shouldn't be shown in navbar anymore)
      const patientId = this.route.snapshot.paramMap.get('patientId') || '123';
      this.appointmentService.loadAppointmentsForPatient(patientId);
    }
  }

  loadDoctorAppointments(userId: string) {
    this.loading = true;
    console.log('Loading appointments for doctor userId:', userId);
    
    // First, get the doctor profile ID from the user ID
    this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${userId}`).subscribe({
      next: (doctorProfile) => {
        console.log('Doctor profile retrieved:', doctorProfile);
        if (doctorProfile && doctorProfile.id) {
          console.log('Loading appointments for doctor profile ID:', doctorProfile.id);
          // Load appointments for this doctor
          this.appointmentService.getAppointmentsByDoctor(doctorProfile.id).subscribe({
            next: (allAppointments) => {
              console.log('All appointments loaded:', allAppointments);
              console.log('Number of appointments:', allAppointments.length);
              
              // Filter to today's appointments only
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayYear = today.getFullYear();
              const todayMonth = today.getMonth();
              const todayDay = today.getDate();
              
              console.log('Today date:', today.toISOString());
              
              this.appointments = allAppointments.filter(appointment => {
                const appointmentDate = new Date(appointment.appointmentDate);
                appointmentDate.setHours(0, 0, 0, 0);
                const appYear = appointmentDate.getFullYear();
                const appMonth = appointmentDate.getMonth();
                const appDay = appointmentDate.getDate();
                
                const isToday = appYear === todayYear && appMonth === todayMonth && appDay === todayDay;
                console.log(`Appointment date: ${appointment.appointmentDate}, Parsed: ${appointmentDate.toISOString()}, Is today: ${isToday}`);
                
                return isToday;
              });
              
              console.log('Filtered appointments for today:', this.appointments.length);
              
              // Load patient names for doctor view
              this.loadPatientNames();
              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading appointments:', err);
              this.loading = false;
            }
          });
        } else {
          console.error('Doctor profile not found or invalid:', doctorProfile);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading doctor profile:', err);
        this.loading = false;
      }
    });
  }

  get appointmentList(): Appointment[] {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'doctor') {
      return this.appointments;
    }
    return this.appointmentService.appointments();
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
          // En cas d'erreur, utiliser l'ID tronqué comme fallback
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
        console.log('RDV annulé');
        // Reload appointments if doctor
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 'doctor') {
          this.loadDoctorAppointments(currentUser.id);
        }
      },
      error: (err: any) => console.error('Erreur', err)
    });
  }
}
