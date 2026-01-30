import { Component, OnInit, signal, computed,inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitHistoryResponse, VisitHistoryItem } from '../../model/visit-history.model';
import { VisitHistoryService } from '../../service/visit-history.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-visit-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent implements OnInit {
  private historyService = inject(VisitHistoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<VisitHistoryResponse | null>(null);

  //  Pagination 
  page = signal(1);
  limit = 5;

  presentVisits = computed<VisitHistoryItem[]>(() =>
    this.data()?.history.filter(h => h.status === 'EFFECTUE') ?? []
  );

  get apiUrl(): string {
    return environment.apiUrl;
  }



  ngOnInit(): void {
    this.loadHistory();
  }


loadHistory(): void {
  this.loading.set(true);
  this.error.set(null);

  const user = this.authService.getCurrentUser();

  if (!user) {
    this.error.set('Utilisateur non authentifié');
    this.loading.set(false);
    return;
  }

  // Check if doctor is accessing /history - redirect to /history/doctor
  if (user.role === 'doctor' && !this.router.url.includes('/history/doctor/patient')) {
    this.router.navigate(['/history/doctor']);
    return;
  }

  
  //  PATIENT
  if (user.role === 'patient') {
    this.historyService
      .getMyHistory(this.page(), this.limit)
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Erreur chargement historique');
          this.loading.set(false);
        },
      });
    return;
  }

// CAS DOCTOR
const patientId =
  window.history.state?.patientId ||
  sessionStorage.getItem('patientHistoryId');

if (!patientId) {
  this.error.set('Patient non sélectionné');
  this.loading.set(false);
  return;
}

this.historyService
  .getDoctorPatientHistory(patientId, this.page(), this.limit)
  .subscribe({
    next: (res) => {
      this.data.set(res);
      this.loading.set(false);
    },
    error: (err) => {
      this.error.set(err.error?.message || 'Failed to load history');
      this.loading.set(false);
    },
  });

}

  nextPage(): void {
    if (this.data() && this.page() < this.data()!.totalPages) {
      this.page.update(p => p + 1);
      this.loadHistory();
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadHistory();
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'EFFECTUE': return 'badge-status badge-status-success';
      case 'ANNULE':   return 'badge-status badge-status-warning';
      case 'ABSENT':   return 'badge-status badge-status-danger';
      default:         return 'badge-status badge-status-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'EFFECTUE': return 'fas fa-check-circle';
      case 'ANNULE':   return 'fas fa-times-circle';
      case 'ABSENT':   return 'fas fa-user-slash';
      default:         return 'fas fa-info-circle';
    }
  }

 
}







