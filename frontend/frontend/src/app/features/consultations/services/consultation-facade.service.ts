import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ConsultationService,
  Consultation,
  CreateConsultationDto
} from './consultation.service';
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
              next: () => console.log('Rendez-vous marqué comme terminé'),
              error: (err) => console.error('Erreur mise à jour rendez-vous:', err),
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
   * Définit l'état de l'appointment
   */
  setAppointmentState(appointment: Appointment): void {
    this.appointmentState.set({
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: new Date(appointment.appointmentDate),
    });
  }

  /**
   * Vérifie l'accès médecin
   */
  verifyDoctorAccess(
    appointment: Appointment,
    userId: string
  ): Observable<boolean> {
    return new Observable((observer) => {
      this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${userId}`).subscribe({
        next: (doctorProfile) => {
          if (!doctorProfile?.id) {
            this.handleError('Doctor profile not found', '/appointments');
            observer.next(false);
            observer.complete();
            return;
          }

          if (appointment.doctorId !== doctorProfile.id) {
            this.handleError('Vous n\'avez pas accès à ce rendez-vous', '/appointments');
            observer.next(false);
            observer.complete();
            return;
          }

          this.setAppointmentState(appointment);
          this.loadPatientConsultations(appointment.patientId);
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération du profil médecin:', err);
          this.error.set('Error verifying permissions');
          observer.next(false);
          observer.complete();
        },
      });
    });
  }

  /**
   * Vérifie l'accès patient
   */
  verifyPatientAccess(appointment: Appointment, userId: string): boolean {
    if (appointment.patientId !== userId) {
      this.handleError('You do not have access to this appointment', '/appointments');
      return false;
    }

    this.setAppointmentState(appointment);
    this.loadPatientConsultations(appointment.patientId);
    return true;
  }

  /**
   * Gère les erreurs avec redirection
   */
  private handleError(message: string, redirectPath: string): void {
    console.error(message);
    this.error.set(`${message}. Redirection...`);
    setTimeout(() => this.router.navigate([redirectPath]), 2000);
  }

  /**
   * Réinitialise l'état
   */
  reset(): void {
    this.patientConsultations.set([]);
    this.currentConsultation.set(null);
    this.appointmentState.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
