import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
    this.doctorId = this.route.snapshot.paramMap.get('doctorId') || '';
    const currentUser = this.authService.getCurrentUser();
    this.patientId = currentUser?.id || '';
    this.loadAvailabilities();
  }

 loadAvailabilities() {
  this.loading = true;
  this.availabilityService.loadAvailabilitiesForDoctor(this.doctorId).subscribe({
    next: (data) => {
      const events = data.map(slot => ({
        id: slot.id,
        title: `${slot.startTime}-${slot.endTime} (${slot.capacity - slot.bookedSlots} slots left)`,
        start: `${slot.date.split('T')[0]}T${slot.startTime}:00`,
        end: `${slot.date.split('T')[0]}T${slot.endTime}:00`,
        extendedProps: { 
          capacity: slot.capacity, 
          booked: slot.bookedSlots 
        },
        backgroundColor: slot.bookedSlots >= slot.capacity ? '#dc3545' : '#28a745',
        borderColor: slot.bookedSlots >= slot.capacity ? '#dc3545' : '#28a745',
      }));

      this.calendarOptions = { ...this.calendarOptions, events };
      this.loading = false;
    }
  });
}
handleEventClick(clickInfo: any) {
  const event = clickInfo.event;
  

  const bookedSlots = event.extendedProps.booked;
  const capacity = event.extendedProps.capacity;
  
  console.log(' DEBUG - bookedSlots:', bookedSlots, 'capacity:', capacity);

  if (bookedSlots < capacity) {
    this.selectedEvent = event;
    console.log(' Slot sélectionné:', event.id);
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
      console.log(' RDV créé:', appointment);
      alert(" RDV réservé !");
      
      this.loadAvailabilities();
      
      setTimeout(() => {
        window.location.href = '/appointments';
      }, 1000);
    },
    error: (err: any) => {
      console.error(' Erreur:', err);
      alert(err.error?.message || "Erreur réservation");
    }
  });
}


 
}
