import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Consultation } from '../../models/consultation.model';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';
import { DownloadPdfDirective } from '../../../../shared/directives/download-pdf.directive';

@Component({
  selector: 'app-consultation-history',
  standalone: true,
  imports: [CommonModule, ConsultationTypePipe, DownloadPdfDirective],
  templateUrl: './consultation-history.component.html',
  styleUrl: './consultation-history.component.scss',
})
export class ConsultationHistoryComponent {
  consultations = input.required<Consultation[]>();
}
