import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConsultationService } from './consultation.service';
import { Consultation } from '../models/consultation.model';
import { CreateConsultationDto } from '../models/create-consultation.dto';
import { AppointmentService, Appointment } from '../../appointments/services/appointment.service';

interface AppointmentState {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
}

/**
 * Facade service pour gérer la logique métier des consultations
 */
@Injectable({
  providedIn: 'root',
})
export class ConsultationFacadeService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly consultationService = inject(ConsultationService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly apiUrl = environment.apiUrl;

  // État réactif
  readonly patientConsultations = signal<Consultation[]>([]);
  readonly currentConsultation = signal<Consultation | null>(null);
  readonly appointmentState = signal<AppointmentState | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Charge les consultations d'un patient
   */
  loadPatientConsultations(patientId: string): void {
    if (!patientId) {
      this.error.set('Patient not identified');
      return;
    }

    this.consultationService.getConsultationsByPatient(patientId).subscribe({
      next: (consultations) => this.patientConsultations.set(consultations),
      error: () => this.error.set('Error loading consultations'),
    });
  }

  /**
   * Crée une nouvelle consultation
   */
  createConsultation(dto: CreateConsultationDto): Observable<Consultation> {
    this.loading.set(true);
    this.error.set(null);

    return this.consultationService.createConsultation(dto).pipe(
      tap({
        next: (consultation) => {
          this.currentConsultation.set(consultation);
          this.loading.set(false);
          this.loadPatientConsultations(consultation.patientId);

          // Marquer le rendez-vous comme terminé
          if (dto.appointmentId) {
            this.appointmentService.markAsDone(dto.appointmentId).subscribe({
              next: () => console.log('Appointment marked as done'),
              error: (err) => console.error('Error updating appointment:', err),
            });
          }
        },
        error: (err: any) => {
          this.error.set(err.error?.message || 'Error during consultation creation');
          this.loading.set(false);
        },
      })
    );
  }

  /**
   * Définit l'état de l'appointment.
   * Réinitialise currentConsultation pour éviter qu'un message de succès
   * d'une consultation précédente reste affiché.
   */
  setAppointmentState(appointment: Appointment): void {
    this.appointmentState.set({
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: new Date(appointment.appointmentDate),
    });

    this.currentConsultation.set(null);
    this.loadPatientConsultations(appointment.patientId);
  }

  /**
   * Gère les erreurs avec redirection
   */
  private handleError(message: string, redirectPath: string): void {
    console.error(message);
    this.error.set(`${message}. Redirecting...`);
    setTimeout(() => this.router.navigate([redirectPath]), 2000);
  }

  /**
   * Télécharge un PDF (ordonnance ou certificat)
   */
  openPdfUrl(relativeUrl: string | null): Observable<void> {
    if (!relativeUrl) {
      this.error.set('PDF not available');
      return of(void 0);
    }

    // Extraire l'ID et le type depuis l'URL
    const match = relativeUrl.match(/consultations\/([^\/]+)\/(ordonnance|certificat)/);
    if (!match) {
      this.error.set('Invalid PDF URL format');
      return of(void 0);
    }

    const [, id, type] = match;

    // Utiliser le service de téléchargement avec JWT
    return (type === 'ordonnance'
      ? (this.consultationService as ConsultationService).downloadOrdonnance(id)
      : (this.consultationService as ConsultationService).downloadCertificat(id)
    ).pipe(
      catchError((err: any) => {
        console.error('PDF download failed:', err);
        this.error.set(`Error downloading ${type}`);
        return of(void 0);
      })
    );
  }

  /**
   * Réinitialise l'état complet du service
   */
  reset(): void {
    this.patientConsultations.set([]);
    this.currentConsultation.set(null);
    this.appointmentState.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
