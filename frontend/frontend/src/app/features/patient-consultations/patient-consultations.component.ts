import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService, Consultation, ConsultationType, CreateConsultationDto } from '../consultations/services/consultation.service';

@Component({
  selector: 'app-patient-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-consultations.component.html',
  styleUrl: './patient-consultations.component.css',
})
export class PatientConsultationsComponent implements OnInit {
  patientId!: string;
  appointmentId!: string;
  doctorId!: string;
  
  patientConsultations: Consultation[] = [];
  consultationForm: FormGroup;
  consultationTypes = ConsultationType;
  consultationTypeKeys = Object.values(ConsultationType);
  currentConsultation: Consultation | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public consultationService: ConsultationService,
    private fb: FormBuilder,
  ) {
    this.consultationForm = this.fb.group({
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [null],
      medicament: [null],
      joursRepos: [null],
    });
  }

  ngOnInit(): void {
    // Récupérer les paramètres de la route
    this.patientId = this.route.snapshot.paramMap.get('patientId')!;
    this.appointmentId = this.route.snapshot.paramMap.get('appointmentId')!;
    this.doctorId = this.route.snapshot.queryParamMap.get('doctorId') || '';
    
    this.loadPatientConsultations();
  }

  loadPatientConsultations(): void {
    this.consultationService.getConsultationsByPatient(this.patientId).subscribe({
      next: (consultations) => {
        this.patientConsultations = consultations;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des consultations:', err);
        this.error = 'Erreur lors du chargement des consultations';
      },
    });
  }

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
        patientId: this.patientId,
        doctorId: this.doctorId,
        type: formValue.type,
        duration: formValue.duration || undefined,
        appointmentId: this.appointmentId,
        medicament: formValue.medicament || undefined,
        joursRepos: formValue.joursRepos || undefined,
      };

      this.consultationService.createConsultation(dto).subscribe({
        next: (consultation) => {
          this.currentConsultation = consultation;
          this.loading = false;
          this.loadPatientConsultations();
          this.consultationForm.reset({
            type: ConsultationType.STANDARD,
            duration: null,
            medicament: null,
            joursRepos: null,
          });
          
          // Afficher un message de succès avec information sur le statut du rendez-vous
          console.log('✅ Consultation créée. Le statut du rendez-vous a été mis à jour en "done".');
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création de la consultation';
          this.loading = false;
        },
      });
    }
  }

  goBack(): void {
    if (this.doctorId) {
      // Naviguer vers la page home - les données seront rechargées automatiquement
      this.router.navigate(['/doctor-home', this.doctorId]).then(() => {
        // Forcer le rechargement de la page pour mettre à jour les statuts
        window.location.reload();
      });
    } else {
      this.router.navigate(['/doctor-home']);
    }
  }
}

