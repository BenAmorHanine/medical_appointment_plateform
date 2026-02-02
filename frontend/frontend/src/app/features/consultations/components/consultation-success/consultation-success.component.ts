import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Consultation } from '../../services/consultation.service';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';

@Component({
  selector: 'app-consultation-success',
  standalone: true,
  imports: [CommonModule, ConsultationTypePipe],
  templateUrl: './consultation-success.component.html',
  styleUrl: './consultation-success.component.scss',
})
export class ConsultationSuccessComponent {
  @Input() consultation: Consultation | null = null;
  @Output() openPdf = new EventEmitter<string | null>();
}
