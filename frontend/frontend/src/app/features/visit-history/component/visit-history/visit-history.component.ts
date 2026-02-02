import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { VisitHistoryResponse } from '../../model/visit-history.model';
import { VisitHistoryService } from '../../service/visit-history.service';
import { AuthService } from '../../../auth/services/auth.service';
import { DownloadPdfDirective } from '../../../../shared/directives/download-pdf.directive';
import { environment } from '../../../../../environments/environment';
import { PAGE_SIZE } from '../../../../shared/constants/pagination.constants';
import { Resource } from '../../../../shared/models/resource.model';

/* =======================
   Initial resource
======================= */

const INITIAL_RESOURCE: Resource<VisitHistoryResponse> = {
  loading: true,
  data: null,
  error: null,
};

@Component({
  selector: 'app-visit-history',
  standalone: true,
  imports: [CommonModule, DownloadPdfDirective],
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent {


  private readonly historyService = inject(VisitHistoryService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


  readonly page = signal(1);
  readonly limit = PAGE_SIZE.VISITS;



  readonly historyResource = toSignal<Resource<VisitHistoryResponse>>(
    toObservable(this.page).pipe(
      switchMap(page => this.loadHistory(page)),
      startWith(INITIAL_RESOURCE),
    ),
    { requireSync: true },
  );


  get apiUrl(): string {
    return environment.apiUrl;
  }

 

  nextPage(): void {
    const data = this.historyResource().data;
    if (data && this.page() < data.totalPages) {
      this.page.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
    }
  }


  private loadHistory(
    page: number,
  ): Observable<Resource<VisitHistoryResponse>> {

    const user = this.authService.getCurrentUser();

    if (!user) {
      return of(this.error('Utilisateur non authentifié'));
    }

    if (user.role === 'patient') {
      return this.historyService
        .getMyHistory(page, this.limit)
        .pipe(this.toResource());
    }

    return this.loadDoctorHistory(page);
  }

  private loadDoctorHistory(
    page: number,
  ): Observable<Resource<VisitHistoryResponse>> {

    const patientId = history.state?.patientId;

    if (!patientId) {
      this.router.navigate(['/history/doctor/patients']);
      return of(this.error('Patient non sélectionné'));
    }

    return this.historyService
      .getDoctorPatientHistory(patientId, page, this.limit)
      .pipe(this.toResource());
  }

 
  private toResource() {
    return (source$: Observable<VisitHistoryResponse>) =>
      source$.pipe(
        map(data => ({
          loading: false,
          data,
          error: null,
        })),
        startWith(INITIAL_RESOURCE),
        catchError(err =>
          of(this.error(err?.error?.message ?? 'Erreur chargement historique')),
        ),
      );
  }

  private error(message: string): Resource<VisitHistoryResponse> {
    return {
      loading: false,
      data: null,
      error: message,
    };
  }
}
