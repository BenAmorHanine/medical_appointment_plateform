import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AppointmentService } from './services/appointment.service'; 
import { Appointment } from './models/appointment.interface';         

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const patientId = this.route.snapshot.paramMap.get('patientId') || '123';
    this.appointmentService.loadAppointmentsForPatient(patientId);
  }

  get appointments(): Appointment[] {
    return this.appointmentService.appointments();
  }

  get loading(): boolean {
    return this.appointmentService.loading();
  }

  cancelAppointment(id: string) {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => console.log('RDV annulé'),
      error: (err: any) => console.error('Erreur', err)
    });
  }
}
