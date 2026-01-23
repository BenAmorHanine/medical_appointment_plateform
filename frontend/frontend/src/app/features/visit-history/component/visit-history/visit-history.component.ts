import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VisitHistoryService } from '../../service/visit-history.service';
import { VisitHistoryResponse, VisitHistoryItem } from '../../model/visit-history.model';

@Component({
  selector: 'app-visit-history',
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent implements OnInit {

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<VisitHistoryResponse | null>(null);

  presentVisits = computed<VisitHistoryItem[]>(() =>
    this.data()?.history.filter(h => h.status === 'EFFECTUE') ?? []
  );

  constructor(
    private historyService: VisitHistoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId');

    const request$ = patientId
      ? this.historyService.getPatientHistory(patientId) //  doctor
      : this.historyService.getMyHistory();              //  patient

    request$.subscribe({
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

  statusClass(status: string): string {
    switch (status) {
      case 'EFFECTUE': return 'badge bg-success';
      case 'ANNULE':   return 'badge bg-warning';
      case 'ABSENT':   return 'badge bg-danger';
      default:         return 'badge bg-secondary';
    }
  }
}
