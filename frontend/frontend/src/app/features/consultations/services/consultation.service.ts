import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Appointment, AppointmentService } from '../../appointments/services/appointment.service';
import { Consultation } from '../models/consultation.model';
import { CreateConsultationDto } from '../models/create-consultation.dto';


@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  // État réactif
  readonly patientConsultations = signal<Consultation[]>([]);
  readonly currentConsultation = signal<Consultation | null>(null);
  readonly appointmentState = signal<Appointment | null>(null);
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

    this.getConsultationsByPatient(patientId).subscribe({
      next: (consultations) => this.patientConsultations.set(consultations),
      error: () => this.error.set('Error loading consultations'),
    });
  }

  createConsultation(dto: CreateConsultationDto): Observable<Consultation> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<Consultation>(this.apiUrl, dto).pipe(
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

  getConsultation(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  getAllConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(this.apiUrl);
  }

  getConsultationsByPatient(patientId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getConsultationsByDoctor(doctorProfileId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorProfileId}`);
  }

  /**
   * Télécharge un document (ordonnance ou certificat) en utilisant HttpClient avec JWT
   * @param consultationId - L'ID de la consultation
   * @param documentType - Type de document ('ordonnance' ou 'certificat')
   */
  private downloadDocument(
    consultationId: string,
    documentType: 'ordonnance' | 'certificat'
  ): Observable<void> {
    return this.http
      .get(`${this.apiUrl}/${consultationId}/${documentType}`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const blob = response.body;
          if (!blob) {
            throw new Error('No blob received');
          }

          // Extraction du nom de fichier depuis les headers
          const contentDisposition = response.headers.get('Content-Disposition');
          const filename = this.extractFilename(contentDisposition, consultationId, documentType);

          // Création et déclenchement du téléchargement
          this.triggerDownload(blob, filename);
        }),
        catchError((error) => {
          console.error(`Erreur lors du téléchargement du ${documentType}:`, error);
          throw error;
        })
      );
  }

  /**
   * Extrait le nom de fichier depuis le header Content-Disposition
   */
  private extractFilename(
    contentDisposition: string | null,
    consultationId: string,
    documentType: string
  ): string {
    if (contentDisposition) {
      // Essayer plusieurs patterns pour extraire le filename
      // Pattern 1: filename="..."
      let match = contentDisposition.match(/filename="([^"]+)"/);
      if (match?.[1]) {
        return match[1];
      }

      // Pattern 2: filename=... (sans guillemets)
      match = contentDisposition.match(/filename=([^;]+)/);
      if (match?.[1]) {
        return match[1].trim();
      }

      // Pattern 3: filename*=UTF-8''...
      match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (match?.[1]) {
        return decodeURIComponent(match[1]);
      }
    }

    // Fallback: générer un nom par défaut
    const date = new Date().toISOString().split('T')[0];
    return `${documentType}-${consultationId}-${date}.pdf`;
  }

  /**
   * Déclenche le téléchargement d'un blob
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  downloadOrdonnance(id: string): Observable<void> {
    return this.downloadDocument(id, 'ordonnance');
  }

  downloadCertificat(id: string): Observable<void> {
    return this.downloadDocument(id, 'certificat');
  }

  /**
   * Définit l'état de l'appointment.
   * Réinitialise currentConsultation pour éviter qu'un message de succès
   * d'une consultation précédente reste affiché.
   */
  setAppointmentState(appointment: Appointment): void {
    this.appointmentState.set(appointment);
    this.currentConsultation.set(null);
    this.loadPatientConsultations(appointment.patientId);
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
      ? this.downloadOrdonnance(id)
      : this.downloadCertificat(id)
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
