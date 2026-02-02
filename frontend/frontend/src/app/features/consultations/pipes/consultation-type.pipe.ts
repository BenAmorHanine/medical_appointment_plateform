import { Pipe, PipeTransform } from '@angular/core';
import { ConsultationType } from '../models/consultation.model';

@Pipe({
  name: 'consultationType',
  standalone: true,
})
export class ConsultationTypePipe implements PipeTransform {
  private readonly labels: Record<ConsultationType, string> = {
    [ConsultationType.STANDARD]: 'Standard Consultation',
    [ConsultationType.CONTROLE]: 'Control Consultation',
    [ConsultationType.URGENCE]: 'Emergency Consultation',
  };

  transform(type: ConsultationType): string {
    return this.labels[type] ?? type;
  }
}
