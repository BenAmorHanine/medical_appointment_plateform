import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsultationService, Consultation, ConsultationType, CreateConsultationDto } from '../consultations/services/consultation.service';
import { AppointmentService, Appointment } from '../appointments/services/appointment.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-patient-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-consultations.component.html',
  styleUrls: ['./patient-consultations.component.css'],
})
export class PatientConsultationsComponent implements OnInit {
  patientId!: string;
  appointmentId!: string;
  doctorId!: string;
  private apiUrl = 'http://localhost:3000';

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
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.consultationForm = this.fb.group({
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [null],
      medicament: [null],
      joursRepos: [null],
    });
  }

  ngOnInit(): void {
    // Récupérer l'appointment depuis le state de navigation
    // getCurrentNavigation() ne fonctionne que pendant la navigation, donc on utilise window.history.state
    let appointment = (window.history.state as any)?.appointment;

    console.log('Appointment récupéré depuis history.state:', appointment);
    console.log('Current user:', this.authService.getCurrentUser());

    if (!appointment || !appointment.id) {
      // Si pas d'appointment dans le state, rediriger vers la liste des rendez-vous
      console.error('Aucun appointment trouvé dans le state');
      this.error = 'Rendez-vous non trouvé. Redirection...';
      setTimeout(() => {
        this.router.navigate(['/appointments']);
      }, 2000);
      return;
    }

    // Utiliser l'utilisateur connecté pour vérifier les permissions
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'Utilisateur non authentifié';
      this.router.navigate(['/auth/login']);
      return;
    }

    // Vérifier les permissions selon le rôle
    if (currentUser.role === 'doctor') {
      // Pour un docteur, on récupère son doctorId depuis son profil
      // Puis on vérifie que l'appointment appartient bien à ce docteur
      this.http.get<any>(`${this.apiUrl}/doctor-profiles/user/${currentUser.id}`).subscribe({
        next: (doctorProfile) => {
          console.log('Doctor profile récupéré:', doctorProfile);
          console.log('Appointment doctorId:', appointment.doctorId);

          if (!doctorProfile || !doctorProfile.id) {
            this.error = 'Profil médecin introuvable';
            setTimeout(() => {
              this.router.navigate(['/appointments']);
            }, 2000);
            return;
          }

          // Si l'appointment n'a pas de doctorId, le récupérer depuis l'appointment
          if (!appointment.doctorId) {
            console.log('Appointment sans doctorId, récupération depuis le backend...');
            this.appointmentService.getAppointment(appointment.id).subscribe({
              next: (fullAppointment: Appointment) => {
                appointment.doctorId = fullAppointment.doctorId;
                this.validateAndLoad(appointment, doctorProfile.id, currentUser);
              },
              error: (err) => {
                console.error('Erreur lors de la récupération de l\'appointment:', err);
                this.error = 'Erreur lors de la récupération du rendez-vous';
              }
            });
          } else {
            this.validateAndLoad(appointment, doctorProfile.id, currentUser);
          }
        },
        error: (err) => {
          console.error('Erreur lors de la récupération du profil médecin:', err);
          this.error = 'Erreur lors de la vérification des permissions';
        }
      });
    } else {
      // Pour un patient, vérifier que c'est bien son rendez-vous
      if (appointment.patientId === currentUser.id) {
        this.appointmentId = appointment.id;
        this.patientId = appointment.patientId;
        this.doctorId = appointment.doctorId || '';
        this.loadPatientConsultations();
      } else {
        this.error = 'Vous n\'avez pas accès à ce rendez-vous';
        setTimeout(() => {
          this.router.navigate(['/appointments']);
        }, 2000);
      }
    }
  }

  private validateAndLoad(appointment: any, doctorProfileId: string, currentUser: any): void {
    if (appointment.doctorId === doctorProfileId) {
      this.appointmentId = appointment.id;
      this.patientId = appointment.patientId;
      this.doctorId = appointment.doctorId;
      this.loadPatientConsultations();
    } else {
      console.error('IDs ne correspondent pas:', {
        doctorProfileId,
        appointmentDoctorId: appointment.doctorId
      });
      this.error = 'Vous n\'avez pas accès à ce rendez-vous';
      setTimeout(() => {
        this.router.navigate(['/appointments']);
      }, 2000);
    }
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
    if (!this.consultationForm.valid) return;
    if (!this.doctorId) {
      this.error = 'Médecin non identifié. Veuillez rafraîchir la page.';
      return;
    }
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

        // Marquer le rendez-vous comme "done" seulement après validation réussie du formulaire
        if (this.appointmentId) {
          this.appointmentService.markAsDone(this.appointmentId).subscribe({
            next: () => {
              console.log('Rendez-vous marqué comme terminé');
            },
            error: (err) => {
              console.error('Erreur lors de la mise à jour du statut du rendez-vous:', err);
              // Ne pas bloquer l'utilisateur si cette mise à jour échoue
            }
          });
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la création de la consultation';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/appointments']);
  }
}
