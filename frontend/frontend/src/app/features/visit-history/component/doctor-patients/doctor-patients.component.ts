import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { VisitHistoryService } from '../../service/visit-history.service';
import { DoctorPatientItem, DoctorPatientsResponse } from '../../model/doctor-patients.model';
import { Resource } from '../../../../shared/models/resource.model';
import { PAGE_SIZE } from '../../../../shared/constants/pagination.constants';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-patients.component.html',
  styleUrls: ['./doctor-patients.component.css'],
})
export class DoctorPatientsComponent {


  private readonly historyService = inject(VisitHistoryService);
  private readonly router = inject(Router);

  readonly page = signal(1);
  readonly limit = PAGE_SIZE.PATIENTS;


  readonly patientsResource = toSignal<Resource<DoctorPatientsResponse>>(
    toObservable(this.page).pipe(
      switchMap(page =>
        this.historyService.getDoctorPatients(page, this.limit).pipe(
          map(res => ({
            loading: false,
            data: res,
            error: null,
          })),
          catchError(err =>
            of({
              loading: false,
              data: null,
              error: err?.error?.message ?? 'Erreur chargement patients',
            }),
          ),
        ),
      ),
      startWith({
        loading: true,
        data: null,
        error: null,
      }),
    ),
    { requireSync: true },
  );

  readonly patients = computed<DoctorPatientItem[]>(() =>
    this.patientsResource().data?.data ?? []
  );

  readonly total = computed(() =>
    this.patientsResource().data?.total ?? 0
  );

  readonly isLoading = computed(() =>
    this.patientsResource().loading
  );

  readonly hasError = computed(() =>
    !!this.patientsResource().error
  );

  readonly totalPages = computed(() =>
    Math.ceil(this.total() / this.limit)
  );

  readonly canGoNext = computed(() =>
    this.page() < this.totalPages()
  );

  readonly canGoPrev = computed(() =>
    this.page() > 1
  );


  next(): void {
    if (this.canGoNext()) {
      this.page.update(p => p + 1);
    }
  }

  prev(): void {
    if (this.canGoPrev()) {
      this.page.update(p => p - 1);
    }
  }



  openHistory(patientId: string): void {
    this.router.navigate(
      ['/history/doctor/patient'],
      { state: { patientId } }
    );
  }
}
