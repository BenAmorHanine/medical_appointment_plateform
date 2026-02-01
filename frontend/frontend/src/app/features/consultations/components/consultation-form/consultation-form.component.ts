import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConsultationType } from '../../services/consultation.service';
import { ConsultationTypePipe } from '../../pipes/consultation-type.pipe';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConsultationTypePipe],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss'],
})
export class ConsultationFormComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() isSubmitDisabled = false;
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formReset = new EventEmitter<void>();

  readonly consultationTypeKeys = Object.values(ConsultationType);

  onFormSubmit(): void {
    this.formSubmit.emit();
  }

  onFormReset(): void {
    this.formReset.emit();
  }
}
