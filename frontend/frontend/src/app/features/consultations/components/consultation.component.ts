import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConsultationService, ConsultationType, CreateConsultationDto } from '../services/consultation.service';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.css',
})
export class ConsultationComponent implements OnInit {
  // Injection moderne Angular 19
  private readonly fb = inject(FormBuilder);
  private readonly consultationService = inject(ConsultationService);

  // Signals pour l'état réactif
  readonly currentConsultation = signal<any>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Form
  readonly consultationForm: FormGroup;
  readonly consultationTypes = ConsultationType;
  readonly consultationTypeKeys = Object.values(ConsultationType);

  // IDs fictifs pour les tests (à remplacer par de vrais IDs)
  private readonly testPatientId = '00000000-0000-0000-0000-000000000001';
  private readonly testDoctorId = '00000000-0000-0000-0000-000000000002';
  private readonly testAppointmentId = '00000000-0000-0000-0000-000000000003';

  constructor() {
    this.consultationForm = this.fb.group({
      patientId: [this.testPatientId, [Validators.required]],
      doctorId: [this.testDoctorId, [Validators.required]],
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [null],
      appointmentId: [this.testAppointmentId],
    });
  }

  ngOnInit(): void {}

  getTypeLabel(type: ConsultationType): string {
    const labels: Record<ConsultationType, string> = {
      [ConsultationType.STANDARD]: 'Consultation Standard',
      [ConsultationType.CONTROLE]: 'Consultation de Contrôle',
      [ConsultationType.URGENCE]: 'Consultation d\'Urgence',
    };
    return labels[type] || type;
  }

  onSubmit(): void {
    if (!this.consultationForm.valid) {
      this.error.set('Veuillez remplir tous les champs requis');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.consultationForm.value;
    const dto: CreateConsultationDto = {
      patientId: formValue.patientId,
      doctorProfileId: formValue.doctorId,
      type: formValue.type,
      duration: formValue.duration || undefined,
      appointmentId: formValue.appointmentId || undefined,
    };

    this.consultationService.createConsultation(dto).subscribe({
      next: (consultation) => {
        this.currentConsultation.set(consultation);
        this.loading.set(false);
        console.log('Consultation créée:', consultation);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors de la création de la consultation');
        this.loading.set(false);
        console.error('Erreur:', err);
      },
    });
  }

  generatePDF(): void {
    const consultation = this.currentConsultation();
    if (consultation?.id) {
      this.loading.set(true);
      // Le PDF est déjà généré lors de la création, on peut juste le télécharger
      this.downloadPDF();
    }
  }

  downloadPDF(): void {
    const consultation = this.currentConsultation();
    if (consultation?.id) {
      this.consultationService.downloadPDF(consultation.id);
    }
  }

  viewPDF(): void {
    const consultation = this.currentConsultation();
    if (consultation?.id) {
      this.consultationService.viewPDF(consultation.id);
    }
  }

  printPDF(): void {
    const consultation = this.currentConsultation();
    if (consultation?.id) {
      this.consultationService.getPDF(consultation.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 100);
        },
        error: (error) => {
          console.error('Erreur lors de l\'impression:', error);
          alert('Erreur lors de l\'impression');
        },
      });
    }
  }

  resetForm(): void {
    this.consultationForm.reset({
      patientId: this.testPatientId,
      doctorId: this.testDoctorId,
      type: ConsultationType.STANDARD,
      duration: null,
      appointmentId: this.testAppointmentId,
    });
    this.currentConsultation.set(null);
    this.error.set(null);
  }
}
