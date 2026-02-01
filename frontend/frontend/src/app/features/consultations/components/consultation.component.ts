import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreateConsultationDto } from '../services/consultation.service';
import { AppointmentService, Appointment } from '../../appointments/services/appointment.service';
import { AuthService } from '../../auth/services/auth.service';
import { ConsultationFacadeService } from '../services/consultation-facade.service';
import { ConsultationFormService } from '../services/consultation-form.service';
import { ConsultationHistoryComponent } from './consultation-history/consultation-history.component';
import { ConsultationFormComponent } from './consultation-form/consultation-form.component';
import { ConsultationSuccessComponent } from './consultation-success/consultation-success.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    CommonModule,
    ConsultationHistoryComponent,
    ConsultationFormComponent,
    ConsultationSuccessComponent,
  ],
  providers: [ConsultationFormService],
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.css'],
})
export class ConsultationComponent implements OnInit, OnDestroy {
  // Services
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);

  readonly facade = inject(ConsultationFacadeService);
  readonly formService = inject(ConsultationFormService);

  // Constantes
  private readonly apiUrl = environment.apiUrl;

  // Computed signals
  readonly isSubmitDisabled = computed(() => {
    return (
      this.facade.loading() ||
      !this.formService.isValid() ||
      this.isButtonDisabled() ||
      this.hasConsultation()
    );
  });

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

  ngOnDestroy(): void {
    this.facade.reset();
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
      next: (appointment: Appointment) => {
        if (currentUser.role === 'doctor') {
          this.facade.verifyDoctorAccess(appointment, currentUser.id).subscribe();
        } else {
          this.facade.verifyPatientAccess(appointment, currentUser.id);
        }
      },
      error: () => {
        this.handleError('Error retrieving the appointment', '/appointments');
      },
    });
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.isSubmitDisabled()) {
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
    this.facade.error.set(`${message}. Redirecting...`);
    setTimeout(() => this.router.navigate([redirectPath]), 2000);
  }
}
