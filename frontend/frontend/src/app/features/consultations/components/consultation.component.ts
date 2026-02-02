import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreateConsultationDto } from '../models/create-consultation.dto';
import { AppointmentService, Appointment } from '../../appointments/services/appointment.service';
import { AuthService } from '../../auth/services/auth.service';
import { ConsultationFacadeService } from '../services/consultation-facade.service';
import { ConsultationFormService } from '../services/consultation-form.service';
import { ConsultationHistoryComponent } from './consultation-history/consultation-history.component';
import { ConsultationFormComponent } from './consultation-form/consultation-form.component';
import { ConsultationSuccessComponent } from './consultation-success/consultation-success.component';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    CommonModule,
    ConsultationHistoryComponent,
    ConsultationFormComponent,
    ConsultationSuccessComponent,
  ],
  providers: [ConsultationFormService],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.css',
})
export class ConsultationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly authService = inject(AuthService);

  readonly facade = inject(ConsultationFacadeService);
  readonly formService = inject(ConsultationFormService);

  readonly isSubmitDisabled = computed(() => {
    return (
      this.facade.loading() ||
      !this.formService.isValid() ||
      this.isButtonDisabled() ||
      this.hasConsultation()
    );
  });

  readonly hasConsultation = computed(() => {
    const consultations = this.facade.patientConsultations();
    const appointmentId = this.facade.appointmentState()?.id;
    return appointmentId
      ? consultations.some((c) => c.appointmentId === appointmentId)
      : false;
  });

  readonly isButtonDisabled = computed(() => {
    const appointmentDate = this.facade.appointmentState()?.appointmentDate;
    if (!appointmentDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDate = new Date(appointmentDate);
    appDate.setHours(0, 0, 0, 0);
    return today < appDate;
  });

  ngOnInit(): void {
    const appointment = (window.history.state as any)?.appointment;
    const currentUser = this.authService.getCurrentUser() as any;

    if (!appointment?.id) {
      this.facade.error.set('No appointment found in state');
      setTimeout(() => this.router.navigate(['/appointments']), 2000);
      return;
    }

    if (!currentUser) {
      this.facade.error.set('User not authenticated');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.appointmentService.getAppointment(appointment.id).subscribe({
      next: (apt: Appointment) => {
        if (currentUser.role === 'doctor') {
          this.facade.verifyDoctorAccess(apt, currentUser.id).subscribe();
        } else {
          this.facade.verifyPatientAccess(apt, currentUser.id);
        }
      },
      error: () => {
        this.facade.error.set('Error retrieving the appointment. Redirecting...');
        setTimeout(() => this.router.navigate(['/appointments']), 2000);
      },
    });
  }

  ngOnDestroy(): void {
    this.facade.reset();
  }

  onSubmit(): void {
    if (this.isSubmitDisabled()) return;

    const appointmentState = this.facade.appointmentState();
    if (!appointmentState) {
      this.facade.error.set('Appointment not identified. Please refresh the page.');
      return;
    }

    const formValue = this.formService.getValue();
    const dto: CreateConsultationDto = {
      patientId: appointmentState.patientId,
      doctorProfileId: appointmentState.doctorId,
      type: formValue.type,
      duration: formValue.duration || undefined,
      appointmentId: appointmentState.id,
      medicament: formValue.medicament || undefined,
      joursRepos: formValue.joursRepos || undefined,
    };

    this.facade.createConsultation(dto).subscribe({
      next: () => this.formService.reset(),
    });
  }
}
