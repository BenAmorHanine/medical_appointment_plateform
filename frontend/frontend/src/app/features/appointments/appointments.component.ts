import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
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
  private router = inject(Router);
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
              // Charger les noms des patients
              this.loadPatientNames();
              this.loading = false;
            },
            error: (err) => {
              console.error('Erreur lors du chargement des rendez-vous:', err);
              this.loading = false;
            }
          });
        } else {
          console.error('Profil médecin introuvable');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du profil médecin:', err);
        this.loading = false;
      }
    });
  }

  loadPatientNames() {
    this.appointmentsWithPatientNames = [];
    const uniquePatientIds = [...new Set(this.appointments.map(apt => apt.patientId))];
    
    uniquePatientIds.forEach(patientId => {
      this.patientService.getPatientName(patientId).subscribe({
        next: (patientName) => {
          // Mettre à jour tous les rendez-vous de ce patient
          this.appointments.forEach(apt => {
            if (apt.patientId === patientId) {
              const existing = this.appointmentsWithPatientNames.find(a => a.id === apt.id);
              if (!existing) {
                this.appointmentsWithPatientNames.push({ ...apt, patientName });
              } else {
                existing.patientName = patientName;
              }
            }
          });
        },
        error: (err) => {
          console.error(`Erreur lors du chargement du nom du patient ${patientId}:`, err);
          // Ajouter quand même le rendez-vous sans nom
          this.appointments.forEach(apt => {
            if (apt.patientId === patientId) {
              const existing = this.appointmentsWithPatientNames.find(a => a.id === apt.id);
              if (!existing) {
                this.appointmentsWithPatientNames.push({ ...apt, patientName: `Patient ${patientId.substring(0, 8)}...` });
              }
            }
          });
        }
      });
    });
  }

  get appointmentList(): any[] {
    // Pour les docteurs, utiliser appointmentsWithPatientNames, sinon appointments
    const source = this.isDoctor ? this.appointmentsWithPatientNames : this.appointments;
    // Filtrer les rendez-vous annulés (le backend renvoie en minuscules: 'reserved', 'cancelled', 'done')
    return source.filter(apt => {
      const status = apt.status?.toLowerCase();
      return status !== 'cancelled';
    });
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
    // Naviguer vers la page de consultation en utilisant le state pour passer l'appointment
    // Cela évite d'exposer les IDs dans l'URL
    console.log('Navigation vers consultation avec appointment:', appointment);
    this.router.navigate(['/consultation'], {
      state: { appointment }
    });
  }

  navigateToDetails(appointment: any) {
    // Naviguer vers les détails de consultation en utilisant le state
    this.router.navigate(['/consultation'], {
      state: { appointment }
    });
  }

  canCancel(appointment: any): boolean {
    // On peut annuler seulement les rendez-vous réservés (pas ceux déjà terminés ou annulés)
    // Le backend renvoie 'reserved' en minuscules, mais l'interface TypeScript utilise 'RESERVED'
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
