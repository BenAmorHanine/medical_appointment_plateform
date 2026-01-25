import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute,Router, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions } from '@fullcalendar/core';
import { AvailabilityService } from '../services/availability.service';
import { AuthService } from '../../auth/services/auth.service';
import { AppointmentService } from '../services/appointment.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterLink, FullCalendarModule],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss'],
})
export class BookAppointmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private availabilityService = inject(AvailabilityService);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router); 

  doctorId = '';
  doctorName = 'Selected Doctor';
  doctorSpecialty = 'Specialty';
  patientId = '';
  loading = false;
  selectedEvent: any = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth',
    },
    height: '70vh',
    slotMinTime: '08:00',
    slotMaxTime: '20:00',
    allDaySlot: false,
    selectable: false,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    eventBackgroundColor: '#28a745',
    eventBorderColor: '#20c997',
    eventTextColor: 'white',
  };

ngOnInit() {
  const doctorData = sessionStorage.getItem('selectedDoctor');
  if (doctorData) {
    const doctor = JSON.parse(doctorData);
    this.doctorId = doctor.id;
    this.doctorName = doctor.name;
    this.doctorSpecialty = doctor.specialty;
    
    const currentUser = this.authService.getCurrentUser();
    this.patientId = currentUser?.id || '';
    this.loadAvailabilities();
    
    sessionStorage.removeItem('selectedDoctor');
  } else {
    this.router.navigate(['/doctors']);
  }
}





loadAvailabilities() {
  this.loading = true;
  this.availabilityService.loadAvailabilitiesForDoctor(this.doctorId).subscribe({
    next: (data) => {
      const events = data.map(slot => {
        const d = new Date(slot.date);
        
      
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`; 

        return {
          id: slot.id,
          title: `${slot.startTime}-${slot.endTime} (${slot.capacity - slot.bookedSlots} slots left)`,
          start: `${dateString}T${slot.startTime}:00`, 
          end: `${dateString}T${slot.endTime}:00`,
          extendedProps: { 
            capacity: slot.capacity, 
            booked: slot.bookedSlots 
          },
          backgroundColor: slot.bookedSlots >= slot.capacity ? '#dc3545' : '#28a745',
          borderColor: slot.bookedSlots >= slot.capacity ? '#dc3545' : '#28a745',
        };
      });

      this.calendarOptions = { ...this.calendarOptions, events };
      this.loading = false;
    },
    error: () => this.loading = false
  });
}

  handleEventClick(clickInfo: any) {
    const event = clickInfo.event;
    const bookedSlots = event.extendedProps.booked;
    const capacity = event.extendedProps.capacity;

    if (bookedSlots < capacity) {
      this.selectedEvent = event;
    } else {
      alert(`Ce créneau est complet ! (${bookedSlots}/${capacity})`);
    }
  }

  bookAppointment() {
    if (!this.selectedEvent || !this.patientId) {
      alert('Sélectionne un créneau !');
      return;
    }

    const dto = {
      patientId: this.patientId,
      availabilityId: this.selectedEvent.id as string
    };

    this.appointmentService.createAppointment(dto).subscribe({
      next: (appointment) => {
        alert('RDV réservé !');
        this.loadAvailabilities();
        setTimeout(() => {
          window.location.href = '/appointments';
        }, 1000);
      },
      error: (err: any) => {
        alert(err.error?.message || 'Erreur réservation');
      }
    });
  }
}
