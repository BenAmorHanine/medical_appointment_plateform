import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Consultation } from '../../services/consultation.service';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';

@Component({
  selector: 'app-consultation-history',
  standalone: true,
  imports: [CommonModule, ConsultationTypePipe],
  templateUrl: './consultation-history.component.html',
  styleUrls: ['./consultation-history.component.scss'],
})
export class ConsultationHistoryComponent {
  @Input({ required: true }) consultations: Consultation[] = [];
  @Output() openPdf = new EventEmitter<string | null>();

  onOpenPdf(url: string | null): void {
    this.openPdf.emit(url);
  }
}
