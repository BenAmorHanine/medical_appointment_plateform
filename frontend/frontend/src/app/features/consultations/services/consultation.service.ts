import { Injectable } from '@angular/core';
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
  doctorId: string;
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
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  createConsultation(
    dto: CreateConsultationDto,
  ): Observable<Consultation> {
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

  downloadOrdonnance(id: string): void {
    this.http.get(`${this.apiUrl}/${id}/ordonnance`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ordonnance-${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de l\'ordonnance:', error);
        alert('Erreur lors du téléchargement de l\'ordonnance');
      },
    });
  }

  downloadCertificat(id: string): void {
    this.http.get(`${this.apiUrl}/${id}/certificat`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificat-${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du certificat:', error);
        alert('Erreur lors du téléchargement du certificat');
      },
    });
  }

  // Méthodes de compatibilité (deprecated)
  getPDF(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/ordonnance`, {
      responseType: 'blob',
    });
  }

  downloadPDF(id: string): void {
    this.downloadOrdonnance(id);
  }

  viewPDF(id: string): void {
    this.http.get(`${this.apiUrl}/${id}/ordonnance`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (error) => {
        console.error('Erreur lors de l\'ouverture du PDF:', error);
        alert('Erreur lors de l\'ouverture du PDF');
      },
    });
  }
}

