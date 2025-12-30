import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationService, ConsultationType, CreateConsultationDto } from '../services/consultation.service';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.css',
})
export class ConsultationComponent implements OnInit {
  consultationForm: FormGroup;
  consultationTypes = ConsultationType;
  consultationTypeKeys = Object.values(ConsultationType);
  currentConsultation: any = null;
  loading = false;
  error: string | null = null;

  // IDs fictifs pour les tests (à remplacer par de vrais IDs)
  testPatientId = '00000000-0000-0000-0000-000000000001';
  testDoctorId = '00000000-0000-0000-0000-000000000002';
  testAppointmentId = '00000000-0000-0000-0000-000000000003';

  constructor(
    private fb: FormBuilder,
    private consultationService: ConsultationService,
  ) {
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
    if (this.consultationForm.valid) {
      this.loading = true;
      this.error = null;

      const formValue = this.consultationForm.value;
      const dto: CreateConsultationDto = {
        patientId: formValue.patientId,
        doctorId: formValue.doctorId,
        type: formValue.type,
        duration: formValue.duration || undefined,
        appointmentId: formValue.appointmentId || undefined,
      };

      this.consultationService.createConsultation(dto).subscribe({
        next: (consultation) => {
          this.currentConsultation = consultation;
          this.loading = false;
          console.log('Consultation créée:', consultation);
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création de la consultation';
          this.loading = false;
          console.error('Erreur:', err);
        },
      });
    } else {
      this.error = 'Veuillez remplir tous les champs requis';
    }
  }

  generatePDF(): void {
    if (this.currentConsultation?.id) {
      this.loading = true;
      // Le PDF est déjà généré lors de la création, on peut juste le télécharger
      this.downloadPDF();
    }
  }

  downloadPDF(): void {
    if (this.currentConsultation?.id) {
      this.consultationService.downloadPDF(this.currentConsultation.id);
    }
  }

  viewPDF(): void {
    if (this.currentConsultation?.id) {
      this.consultationService.viewPDF(this.currentConsultation.id);
    }
  }

  printPDF(): void {
    if (this.currentConsultation?.id) {
      this.consultationService.getPDF(this.currentConsultation.id).subscribe({
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
    this.currentConsultation = null;
    this.error = null;
  }
}

