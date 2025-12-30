import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService, Appointment } from '../appointments/services/appointment.service';
import { ConsultationService, Consultation, ConsultationType, CreateConsultationDto } from '../consultations/services/consultation.service';
import { PatientService } from '../patients/services/patient.service';

@Component({
  selector: 'app-doctor-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctor-home.component.html',
  styleUrls: ['./doctor-home.component.css'],
})
export class DoctorHomeComponent implements OnInit {
  doctorId!: string; // maintenant dynamique depuis l'URL
  appointments: Appointment[] = [];
  appointmentsWithPatientNames: Array<Appointment & { patientName: string }> = [];
  appointmentsByDate: { [date: string]: Appointment[] } = {};
  consultationForm: FormGroup;
  consultationTypes = ConsultationType;
  consultationTypeKeys = Object.values(ConsultationType);
  currentConsultation: Consultation | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public appointmentService: AppointmentService,
    public consultationService: ConsultationService,
    private patientService: PatientService,
    private fb: FormBuilder
  ) {
    this.consultationForm = this.fb.group({
      type: [ConsultationType.STANDARD, [Validators.required]],
      duration: [null],
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID depuis l'URL
    this.doctorId = this.route.snapshot.paramMap.get('id')!;
    console.log('Doctor ID:', this.doctorId);

    this.loadAppointments();
  }

  // Méthode appelée quand on revient sur cette page
  // Utiliser le hook de cycle de vie approprié ou recharger manuellement
  reloadAppointments(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.appointmentService.getAppointmentsByDoctor(this.doctorId).subscribe({
      next: (appointments) => {
        // Filtrer uniquement les rendez-vous d'aujourd'hui
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        
        this.appointments = appointments.filter(appointment => {
          // Convertir la date du rendez-vous en date locale pour comparaison
          const appointmentDate = new Date(appointment.appointmentDate);
          const appYear = appointmentDate.getFullYear();
          const appMonth = appointmentDate.getMonth();
          const appDay = appointmentDate.getDate();
          
          // Comparer année, mois et jour (ignorer l'heure et le fuseau horaire)
          return appYear === todayYear && appMonth === todayMonth && appDay === todayDay;
        });
        
        // Charger les noms des patients
        this.loadPatientNames();
        this.groupAppointmentsByDate();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous:', err);
        this.error = 'Erreur lors du chargement des rendez-vous';
      },
    });
  }

  loadPatientNames(): void {
    this.appointmentsWithPatientNames = [];
    this.appointments.forEach(appointment => {
      this.patientService.getPatientName(appointment.patientId).subscribe({
        next: (patientName) => {
          this.appointmentsWithPatientNames.push({
            ...appointment,
            patientName: patientName
          });
        },
        error: () => {
          // En cas d'erreur, utiliser l'ID tronqué comme fallback
          this.appointmentsWithPatientNames.push({
            ...appointment,
            patientName: `Patient ${appointment.patientId.substring(0, 8)}...`
          });
        }
      });
    });
  }

  getPatientName(patientId: string): string {
    const appointment = this.appointmentsWithPatientNames.find(a => a.patientId === patientId);
    return appointment?.patientName || `Patient ${patientId.substring(0, 8)}...`;
  }

  groupAppointmentsByDate(): void {
    this.appointmentsByDate = {};
    this.appointments.forEach(appointment => {
      const date = new Date(appointment.appointmentDate).toLocaleDateString('fr-FR');
      if (!this.appointmentsByDate[date]) {
        this.appointmentsByDate[date] = [];
      }
      this.appointmentsByDate[date].push(appointment);
    });
  }

  selectAppointment(appointment: Appointment): void {
    // Naviguer vers la page des consultations du patient
    this.router.navigate(['/patient-consultations', appointment.patientId, appointment.id], {
      queryParams: { doctorId: this.doctorId }
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


  getDates(): string[] {
    return Object.keys(this.appointmentsByDate).sort();
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
