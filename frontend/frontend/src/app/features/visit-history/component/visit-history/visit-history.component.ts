import { Component, OnInit } from '@angular/core';
import { VisitHistoryService } from '../../service/visit-history.service';
import { VisitHistoryResponse } from '../../model/visit-history.model';

@Component({
  selector: 'app-visit-history',
  templateUrl: './visit-history.component.html',
  styleUrls: ['./visit-history.component.css'],
})
export class VisitHistoryComponent implements OnInit {
  loading = true;
  error: string | null = null;
  data?: VisitHistoryResponse;

  constructor(private historyService: VisitHistoryService) {}

  ngOnInit(): void {
    this.historyService.getMyHistory().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load history';
        this.loading = false;
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'EFFECTUE':
        return 'badge bg-success';
      case 'ANNULE':
        return 'badge bg-warning';
      case 'ABSENT':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
