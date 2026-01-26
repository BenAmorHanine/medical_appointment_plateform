import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VisitHistoryResponse, VisitHistoryItem } from '../../model/visit-history.model';
import { VisitHistoryService } from '../../service/visit-history.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-visit-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent implements OnInit {

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<VisitHistoryResponse | null>(null);

  // 🔽 Pagination state
  page = signal(1);
  limit = 5;

  presentVisits = computed<VisitHistoryItem[]>(() =>
    this.data()?.history.filter(h => h.status === 'EFFECTUE') ?? []
  );

  constructor(
    private historyService: VisitHistoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    const patientId = this.route.snapshot.paramMap.get('patientId');

    const request$ = patientId
      ? this.historyService.getPatientHistory(patientId, this.page(), this.limit)
      : this.historyService.getMyHistory(this.page(), this.limit);

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
      case 'EFFECTUE': return 'badge bg-success';
      case 'ANNULE':   return 'badge bg-warning';
      case 'ABSENT':   return 'badge bg-danger';
      default:         return 'badge bg-secondary';
    }
  }
}
