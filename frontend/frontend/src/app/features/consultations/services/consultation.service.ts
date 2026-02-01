import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export enum ConsultationType {
  STANDARD = 'standard',
  CONTROLE = 'controle',
  URGENCE = 'urgence',
}

export interface CreateConsultationDto {
  patientId: string;
  doctorProfileId: string;
  type: ConsultationType;
  duration?: number;
  appointmentId?: string;
  medicament?: string;
  joursRepos?: number;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorProfileId: string;
  type: ConsultationType;
  duration: number;
  appointmentId: string | null;
  pdfUrl: string | null;
  medicament: string | null;
  joursRepos: number | null;
  ordonnanceUrl: string | null;
  certificatUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  createConsultation(dto: CreateConsultationDto): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, dto);
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
   * Télécharge un document (ordonnance ou certificat) en utilisant le blob response
   * @param consultationId - L'ID de la consultation
   * @param documentType - Type de document ('ordonnance' ou 'certificat')
   */
  private downloadDocument(consultationId: string, documentType: 'ordonnance' | 'certificat'): void {
    this.http
      .get(`${this.apiUrl}/${consultationId}/${documentType}`, {
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          // Extraction du nom de fichier depuis les headers
          const contentDisposition = response.headers.get('Content-Disposition');
          const filename = this.extractFilename(contentDisposition, consultationId, documentType);

          // Création et déclenchement du téléchargement
          this.triggerDownload(blob, filename);
        },
        error: (error) => {
          console.error(`Erreur lors du téléchargement du ${documentType}:`, error);
          alert(`Erreur lors du téléchargement du ${documentType}`);
        },
      });
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
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match?.[1]) {
        return match[1];
      }
    }
    return `${documentType}-${consultationId}.pdf`;
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

  downloadOrdonnance(id: string): void {
    this.downloadDocument(id, 'ordonnance');
  }

  downloadCertificat(id: string): void {
    this.downloadDocument(id, 'certificat');
  }
}
