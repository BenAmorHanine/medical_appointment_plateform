import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Consultation } from '../../models/consultation.model';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';
import { DownloadPdfDirective } from '../../../../shared/directives/download-pdf.directive';

@Component({
  selector: 'app-consultation-success',
  standalone: true,
  imports: [CommonModule, ConsultationTypePipe, DownloadPdfDirective],
  templateUrl: './consultation-success.component.html',
  styleUrl: './consultation-success.component.scss',
})
export class ConsultationSuccessComponent {
  @Input() consultation: Consultation | null = null;
}
