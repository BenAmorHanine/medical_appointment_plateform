import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConsultationType } from '../../models/consultation.model';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConsultationTypePipe],
  templateUrl: './consultation-form.component.html',
  styleUrl: './consultation-form.component.scss',
})
export class ConsultationFormComponent {
  form = input.required<FormGroup>();
  loading = input(false);
  error = input<string | null>(null);
  isSubmitDisabled = input(false);
  formSubmit = output<void>();
  formReset = output<void>();

  readonly consultationTypeKeys = Object.values(ConsultationType);
}
