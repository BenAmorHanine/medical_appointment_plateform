import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ConsultationService,
  ConsultationType,
  CreateConsultationDto,
} from '../services/consultation.service';
import { AppointmentService } from '../../appointments/services/appointment.service';
import { AuthService } from '../../auth/services/auth.service';
import { ConsultationFacadeService } from '../services/consultation-facade.service';
import { ConsultationFormService } from '../services/consultation-form.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [ConsultationFormService],
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.css'],
})
export class ConsultationComponent implements OnInit {
  // Services
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);
  private readonly consultationService = inject(ConsultationService);

  readonly facade = inject(ConsultationFacadeService);
  readonly formService = inject(ConsultationFormService);

  // Constantes pour le template
  readonly apiUrl = environment.apiUrl;
  readonly consultationTypes = ConsultationType;
  readonly consultationTypeKeys = Object.values(ConsultationType);

  // Computed signals
  readonly hasConsultation = computed(() => {
    const consultations = this.facade.patientConsultations();
    const appointmentId = this.facade.appointmentState()?.id;
    return appointmentId
      ? consultations.some((c) => c.appointmentId === appointmentId)
      : false;
  });

  readonly isButtonDisabled = computed(() => {
    const appointmentDate = this.facade.appointmentState()?.appointmentDate;
    if (!appointmentDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDate = new Date(appointmentDate);
    appDate.setHours(0, 0, 0, 0);
    return today < appDate;
  });

  ngOnInit(): void {
    const appointment = (window.history.state as any)?.appointment;
    const currentUser = this.authService.getCurrentUser() as any;

    if (!this.validateInitialState(appointment, currentUser)) {
      return;
    }

    this.initializeAppointment(appointment.id, currentUser);
  }

  /**
   * Valide l'état initial
   */
  private validateInitialState(appointment: any, currentUser: any): boolean {
    if (!appointment?.id) {
      this.handleError('No appointment found in state', '/appointments');
      return false;
    }

    if (!currentUser) {
      this.facade.error.set('User not authenticated');
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }

  /**
   * Initialise l'appointment
   */
  private initializeAppointment(appointmentId: string, currentUser: any): void {
    this.appointmentService.getAppointment(appointmentId).subscribe({
      next: (appointment) => {
        if (currentUser.role === 'doctor') {
          this.facade.verifyDoctorAccess(appointment, currentUser.id).subscribe();
        } else {
          this.facade.verifyPatientAccess(appointment, currentUser.id);
        }
      },
      error: () => {
        this.handleError('Erreur lors de la récupération du rendez-vous', '/appointments');
      },
    });
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.facade.loading() || !this.formService.isValid() || this.hasConsultation()) {
      return;
    }

    const appointmentState = this.facade.appointmentState();
    if (!appointmentState) {
      this.facade.error.set('Appointment not identified. Please refresh the page.');
      return;
    }

    const formValue = this.formService.getValue();
    const dto: CreateConsultationDto = {
      patientId: appointmentState.patientId,
      doctorProfileId: appointmentState.doctorId,
      type: formValue.type,
      duration: formValue.duration || undefined,
      appointmentId: appointmentState.id,
      medicament: formValue.medicament || undefined,
      joursRepos: formValue.joursRepos || undefined,
    };

    this.facade.createConsultation(dto).subscribe({
      next: () => this.formService.reset(),
    });
  }

  /**
   * Réinitialise le formulaire
   */
  resetForm(): void {
    this.formService.reset();
  }

  /**
   * Retourne le label d'un type de consultation
   */
  getTypeLabel(type: ConsultationType): string {
    const labels: Record<ConsultationType, string> = {
      [ConsultationType.STANDARD]: 'Standard Consultation',
      [ConsultationType.CONTROLE]: 'Control Consultation',
      [ConsultationType.URGENCE]: 'Emergency Consultation',
    };
    return labels[type] || type;
  }

  /**
   * Ouvre un PDF dans un nouvel onglet
   */
  openPdfUrl(relativeUrl: string | null): void {
    if (!relativeUrl) {
      this.facade.error.set('PDF not available');
      return;
    }
    window.open(`${this.apiUrl}${relativeUrl}`, '_blank');
  }

  /**
   * Télécharge une ordonnance
   */
  downloadOrdonnance(consultationId: string): void {
    this.consultationService.downloadOrdonnance(consultationId);
  }

  /**
   * Télécharge un certificat
   */
  downloadCertificat(consultationId: string): void {
    this.consultationService.downloadCertificat(consultationId);
  }

  /**
   * Retourne à la page des rendez-vous
   */
  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  /**
   * Gère les erreurs avec redirection
   */
  private handleError(message: string, redirectPath: string): void {
    console.error(message);
    this.facade.error.set(`${message}. Redirection...`);
    setTimeout(() => this.router.navigate([redirectPath]), 2000);
  }
}
