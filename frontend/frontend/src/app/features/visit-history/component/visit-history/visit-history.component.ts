import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitHistoryResponse, VisitHistoryItem } from '../../model/visit-history.model';
import { VisitHistoryService } from '../../service/visit-history.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../auth/services/auth.service';
import { ConsultationFacadeService } from '../../../consultations/services/consultation-facade.service';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-visit-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent {
  private historyService = inject(VisitHistoryService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private consultationFacade = inject(ConsultationFacadeService);

  // Pagination Signals
  page = signal(1);
  limit = 5;

  // Déclencheur réactif pour le rechargement (page ou user change)
  private reloadTrigger$ = toObservable(this.page).pipe(
    startWith(this.page())
  );

  // Resource-like Signal: Gère automatiqument Loading / Data / Error
  historyResource = toSignal(
    this.reloadTrigger$.pipe(
      switchMap((currentPage) => {
        const user = this.authService.getCurrentUser();

        if (!user) {
          return of({ loading: false, data: null, error: 'Utilisateur non authentifié' });
        }

        // Check Access
        if (user.role === 'doctor' && !this.router.url.includes('/history/doctor/patient')) {
          this.router.navigate(['/history/doctor']);
          return of({ loading: false, data: null, error: 'Redirection...' });
        }

        // Determine Request
        let request$;
        if (user.role === 'patient') {
          request$ = this.historyService.getMyHistory(currentPage, this.limit);
        } else {
          const patientId = window.history.state?.patientId || sessionStorage.getItem('patientHistoryId');
          if (!patientId) {
            return of({ loading: false, data: null, error: 'Patient non sélectionné' });
          }
          request$ = this.historyService.getDoctorPatientHistory(patientId, currentPage, this.limit);
        }

        // Execute Request
        return request$.pipe(
          map(data => ({ loading: false, data, error: null })),
          startWith({ loading: true, data: null, error: null }),
          catchError(err => of({
            loading: false,
            data: null,
            error: err.error?.message || 'Erreur chargement historique'
          }))
        );
      })
    ),
    { initialValue: { loading: true, data: null, error: null } }
  );

  // Computed values derived from the resource
  presentVisits = computed<VisitHistoryItem[]>(() =>
    this.historyResource().data?.history.filter(h => h.status === 'EFFECTUE') ?? []
  );

  get apiUrl(): string {
    return environment.apiUrl;
  }

  nextPage(): void {
    const currentData = this.historyResource().data;
    if (currentData && this.page() < currentData.totalPages) {
      this.page.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'EFFECTUE': return 'badge-status badge-status-success';
      case 'ANNULE': return 'badge-status badge-status-warning';
      case 'ABSENT': return 'badge-status badge-status-danger';
      default: return 'badge-status badge-status-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'EFFECTUE': return 'fas fa-check-circle';
      case 'ANNULE': return 'fas fa-times-circle';
      case 'ABSENT': return 'fas fa-user-slash';
      default: return 'fas fa-info-circle';
    }
  }

  /**
   * Télécharge un PDF en réutilisant la logique du facade (DRY)
   */
  downloadPdf(url: string, event: Event): void {
    event.preventDefault();
    this.consultationFacade.openPdfUrl(url);
  }
}
