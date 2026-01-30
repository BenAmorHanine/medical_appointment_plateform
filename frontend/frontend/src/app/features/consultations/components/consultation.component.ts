import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsultationService, Consultation, ConsultationType, CreateConsultationDto } from '../services/consultation.service';
import { AppointmentService, Appointment } from '../../appointments/services/appointment.service';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.css'],
})
export class ConsultationComponent implements OnInit {
  // Injection moderne Angular 19
  private readonly router = inject(Router);
  private readonly consultationService = inject(ConsultationService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  // Signals pour l'état réactif
  readonly patientConsultations = signal<Consultation[]>([]);
  readonly currentConsultation = signal<Consultation | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasConsultation = signal(false);

  // Propriétés simples
  patientId = '';
  appointmentId = '';
  doctorId = '';
  patientProfileId = '';
  doctorProfileId = '';
  appointmentDate: Date | null = null;
  private readonly apiUrl = environment.apiUrl;

  // Form
  readonly consultationForm: FormGroup;
  readonly consultationTypes = ConsultationType;
  readonly consultationTypeKeys = Object.values(ConsultationType);

  constructor() {
    this.consultationForm = this.fb.group({
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [null],
      medicament: [null],
      joursRepos: [null],
    });

    // Auto-remplir la durée lorsque le type change
    this.consultationForm.get('type')?.valueChanges.subscribe((selectedType: ConsultationType) => {
      const defaultDurations: Record<ConsultationType, number> = {
        [ConsultationType.STANDARD]: 30,
        [ConsultationType.CONTROLE]: 15,
        [ConsultationType.URGENCE]: 45,
      };
      this.consultationForm.patchValue({ duration: defaultDurations[selectedType] });
    });

    // Définir la durée initiale pour le type par défaut
    this.consultationForm.patchValue({ duration: 30 });
  }

  ngOnInit(): void {
    const appointment = (window.history.state as any)?.appointment;
    const currentUser = this.authService.getCurrentUser() as any;

    console.log('Appointment récupéré depuis history.state:', appointment);
    console.log('Current user:', currentUser);

    if (!appointment?.id) {
      this.handleError('No appointment found in state', '/appointments');
      return;
    }

    if (!currentUser) {
      this.error.set('User not authenticated');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Récupérer l'appointment complet pour avoir la date
    this.appointmentService.getAppointment(appointment.id).subscribe({
      next: (fullAppointment) => {
        console.log('Appointment complet:', fullAppointment);
        this.appointmentDate = new Date(fullAppointment.appointmentDate);
        if (currentUser.role === 'doctor') {
          this.handleDoctorAccess(fullAppointment, currentUser);
        } else {
          this.handlePatientAccess(fullAppointment, currentUser);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'appointment:', err);
        this.handleError('Erreur lors de la récupération du rendez-vous', '/appointments');
      }
    });
  }

  private handleDoctorAccess(appointment: any, currentUser: any): void {
    this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${currentUser.id}`).subscribe({
      next: (doctorProfile) => {
        console.log('Doctor profile récupéré:', doctorProfile);
        console.log('Appointment doctorId:', appointment.doctorId);

        if (!doctorProfile?.id) {
          this.handleError('Doctor profile not found', '/appointments');
          return;
        }

        if (!appointment.doctorId) {
          console.log('Appointment sans doctorId, récupération depuis le backend...');
          this.appointmentService.getAppointment(appointment.id as string).subscribe({
            next: (fullAppointment: Appointment) => {
              appointment.doctorId = fullAppointment.doctorId;
              this.validateAndLoad(appointment, doctorProfile.id);
            },
            error: (err: any) => {
              console.error('Erreur lors de la récupération de l\'appointment:', err);
              this.error.set('Error retrieving appointment');
            }
          });
        } else {
          this.validateAndLoad(appointment, doctorProfile.id);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du profil médecin:', err);
        this.error.set('Error verifying permissions');
      }
    });
  }

  private handlePatientAccess(appointment: any, currentUser: any): void {
    if (appointment.patientId === currentUser.id) {
      this.appointmentId = appointment.id;
      this.patientId = appointment.patientId;
      this.doctorId = appointment.doctorId || '';
      this.appointmentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate) : null;
      this.loadPatientConsultations();
    } else {
      this.handleError('You do not have access to this appointment', '/appointments');
    }
  }

  private validateAndLoad(appointment: any, doctorProfileId: string): void {
    if (appointment.doctorId === doctorProfileId) {
      this.appointmentId = appointment.id;
      this.patientId = appointment.patientId;
      this.doctorId = appointment.doctorId;
      this.patientProfileId = appointment.patientId;   // profileId (chez toi = même valeur)
      this.doctorProfileId = doctorProfileId;
      this.appointmentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate) : null;

      this.loadPatientConsultations();
    } else {
      console.error('IDs ne correspondent pas:', {
        doctorProfileId,
        appointmentDoctorId: appointment.doctorId
      });
      this.handleError('Vous n\'avez pas accès à ce rendez-vous', '/appointments');
    }
  }

  private handleError(message: string, redirectPath: string): void {
    console.error(message);
    this.error.set(`${message}. Redirection...`);
    setTimeout(() => this.router.navigate([redirectPath]), 2000);
  }
/*
  loadPatientConsultations(): void {
    this.consultationService.getConsultationsByPatient(this.patientId).subscribe({
      next: (consultations) => this.patientConsultations.set(consultations),
      error: (err) => {
        console.error('Erreur lors du chargement des consultations:', err);
        this.error.set('Erreur lors du chargement des consultations');
      },
    });
  }*/
 loadPatientConsultations(): void {
  if ((this.authService.getCurrentUser() as any)?.role === 'doctor') {
    this.consultationService
      .getConsultationsByDoctor(this.doctorProfileId)
      .subscribe({
        next: (consultations) => {
          this.patientConsultations.set(consultations);
          // Détecter s'il existe une consultation associée à l'appointment courant
          if (this.appointmentId) {
            const exists = consultations.some(c => c.appointmentId === this.appointmentId);
            this.hasConsultation.set(exists);
          }
         },
         error: () => {
           this.error.set('Error loading consultations');
         },
       });
  } else {
    this.consultationService
      .getConsultationsByPatient(this.patientId)
      .subscribe({
        next: (consultations) => {
          this.patientConsultations.set(consultations);
          if (this.appointmentId) {
            const exists = consultations.some(c => c.appointmentId === this.appointmentId);
            this.hasConsultation.set(exists);
          }
         },
         error: () => {
           this.error.set('Error loading consultations');
         },
       });
  }
}


  getTypeLabel(type: ConsultationType): string {
    const labels: Record<ConsultationType, string> = {
      [ConsultationType.STANDARD]: 'Standard Consultation',
      [ConsultationType.CONTROLE]: 'Control Consultation',
      [ConsultationType.URGENCE]: 'Emergency Consultation',
    };
    return labels[type] || type;
  }

  onSubmit(): void {
    // Empêcher double-submit : si une soumission est déjà en cours, on ignore
    if (this.loading()) {
      return;
    }
    if (!this.consultationForm.valid || !this.doctorId) {
      if (!this.doctorId) {
        this.error.set('Doctor not identified. Please refresh the page.');
      }
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    // Prévenir double-creation côté UI immédiatement
    this.hasConsultation.set(true);

    const formValue = this.consultationForm.value;
    const dto: CreateConsultationDto = {
      patientId: this.patientId,
      doctorProfileId: this.doctorId,
      type: formValue.type,
      duration: formValue.duration || undefined,
      appointmentId: this.appointmentId,
      medicament: formValue.medicament || undefined,
      joursRepos: formValue.joursRepos || undefined,
    };

    this.consultationService.createConsultation(dto).subscribe({
      next: (consultation) => {
        this.currentConsultation.set(consultation);
        // Marquer qu'il y a une consultation pour l'appointment (renvoi d'existante possible)
        // already set to true before le call; ensure it's true
        this.hasConsultation.set(true);
        this.loading.set(false);
        this.loadPatientConsultations();
        this.consultationForm.reset({
          type: ConsultationType.STANDARD,
          duration: null,
          medicament: null,
          joursRepos: null,
        });

        if (this.appointmentId) {
          this.appointmentService.markAsDone(this.appointmentId as string).subscribe({
            next: () => console.log('Rendez-vous marqué comme terminé'),
            error: (err: any) => console.error('Erreur lors de la mise à jour du statut du rendez-vous:', err)
          });
        }
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Error during consultation creation');
        // Revenir en arrière si la création a échoué
        this.loading.set(false);
        this.hasConsultation.set(false);
      },
    });
  }

  resetForm(): void {
    this.consultationForm.patchValue({
      type: this.consultationTypes.STANDARD,
      duration: null,
      medicament: null,
      joursRepos: null
    });
  }

  downloadOrdonnance(consultationId: string): void {
    this.consultationService.downloadOrdonnance(consultationId);
  }

  downloadCertificat(consultationId: string): void {
    this.consultationService.downloadCertificat(consultationId);
  }

  // Opens a relative PDF URL (/consultations/:id/...) in a new tab
  openPdfUrl(relativeUrl: string | null): void {
    if (!relativeUrl) {
      this.error.set('PDF not available');
      return;
    }

    const fullUrl = `${this.apiUrl}${relativeUrl}`;
    window.open(fullUrl, '_blank');
  }

  // Méthode de navigation
  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  isButtonDisabled(): boolean {
    if (!this.appointmentDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDate = new Date(this.appointmentDate);
    appDate.setHours(0, 0, 0, 0);
    return today < appDate;
  }
}
