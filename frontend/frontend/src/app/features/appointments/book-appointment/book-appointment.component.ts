import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';
import { AvailabilityService } from '../services/availability.service';
import { AuthService } from '../../auth/services/auth.service';
import { AppointmentService } from '../services/appointment.service';
import { CalendarSlotEvent } from '../models/calendar-slot.interface';
import { PatientService } from '../../patients/services/patient.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterLink, FullCalendarModule],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.css'],
})
export class BookAppointmentComponent implements OnInit {
  private availabilityService = inject(AvailabilityService);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private router = inject(Router); 

  doctorId = '';
  doctorName = 'Selected Doctor';
  doctorSpecialty = 'Specialty';
  patientId = '';
  loading = false;
  selectedEvent: CalendarSlotEvent | null = null;

  message: string | null = null;
  messageType: 'success' | 'error' | null = null;
  private messageTimeout: any;

calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    allDaySlot: false,
    height: '70vh',
    events: [],
    eventClick: (info) => this.handleEventClick(info), 
  };



  ngOnInit() {
      this.initDoctor();
      this.initPatient();
    }

  private initDoctor() {
    const doctorData = sessionStorage.getItem('selectedDoctor');
    if (!doctorData) {
      this.router.navigate(['/doctors']);
      return;
    }

    const doctor = JSON.parse(doctorData);
    this.doctorId = doctor.doctorProfileId ?? doctor.id;
    this.doctorName = doctor.name;
    this.doctorSpecialty = doctor.specialty;
  }

  private initPatient() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.patientService.getByUserId(user.id).subscribe({
      next: (profile) => {
        this.patientId = profile.id;
        this.loadAvailabilities();
      },
      error: () => this.showMessage('Error fetching patient profile', 'error')
    });
  }


  loadAvailabilities() {
    if (!this.doctorId) {
      return;
    }
    
    this.loading = true;
    this.availabilityService. loadAvailabilitiesForDoctor(this.doctorId).subscribe({
      next: (slots: any[]) => {
        const events: CalendarSlotEvent[] = slots.map(slot => this.mapSlotToEvent(slot));
     
        this.calendarOptions = { 
          ...this.calendarOptions, 
          events: events 
        };
        
        this.loading = false;
      },
      error: () => {
        this.showMessage('Error loading availabilities', 'error');
        this.loading = false;
      }
    });
  }

  private mapSlotToEvent(slot: any): CalendarSlotEvent {
    const isFull = slot.bookedSlots >= slot.capacity;
    const d = new Date(slot.date);
    const cleanDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return {
      id: slot.id,
      title: isFull ? 'Complet' : `Disponible (${slot.startTime})`,
      start: `${cleanDate}T${slot.startTime}`,
      end: `${cleanDate}T${slot.endTime}`,
      classNames: [isFull ? 'event-full' : 'event-available'],
      extendedProps: {
        booked: slot.bookedSlots,
        capacity: slot.capacity
      }
    };
  }

  handleEventClick(clickInfo:any) {
    const event = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      extendedProps: clickInfo.event.extendedProps
    } as CalendarSlotEvent;

    if (event.extendedProps.booked < event.extendedProps.capacity) {
      this.selectedEvent = event;
    } else {
      this.showMessage('This slot is fully booked!', 'error');
      this.selectedEvent = null;
    }
  }

  bookAppointment() {
    if (!this.selectedEvent) {
    this.showMessage('Invalid selection', 'error');
    return;
  }

  if (!this.patientId) {
    this.showMessage('profile error', 'error');
    return;
  }

    this.appointmentService.createAppointment({
      patientId: this.patientId,
      availabilityId: this.selectedEvent.id
    }).subscribe({
      next: () => {
        this.showMessage('Appointment booked successfully!', 'success');
        this.loadAvailabilities();
        //setTimeout(() => this.router.navigate(['/appointments']), 1000);
      },
      error: () => {
        this.showMessage('Error while booking', 'error');
        this.loading = false;
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error') {
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    this.message = msg;
    this.messageType = type;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.messageTimeout = setTimeout(() => this.message = null, 5000);
  }
}
