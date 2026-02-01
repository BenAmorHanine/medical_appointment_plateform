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
import { environment } from '../../../../environments/environment';

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
  if (!doctorData) {
    console.error('Aucun docteur sélectionné en session, redirection...');
    this.router.navigate(['/doctors']);
    return;
  }

  const doctor = JSON.parse(doctorData);
  this.doctorId = doctor.doctorProfileId || doctor.id; 
  this.doctorName = doctor.name;
  this.doctorSpecialty = doctor.specialty;

  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) return;

  fetch(`${environment.apiUrl}/patient-profiles/user/${currentUser.id}`)
    .then(res => res.json())
    .then(patientProfile => {
      this.patientId = patientProfile.id;
      this.loadAvailabilities(); 
    })
    .catch(err => console.error('Erreur Fetch PatientProfile:', err));

   
  // sessionStorage.removeItem('selectedDoctor'); 
}




loadAvailabilities() {
  if (!this.doctorId) {
    console.warn('Abandon : doctorId est vide');
    return;
  }
  
  this.loading = true;
  this.availabilityService.loadAvailabilitiesForDoctor(this.doctorId).subscribe({
    next: (data) => {
    const events = data.map(slot => {
    const isFull = slot.bookedSlots >= slot.capacity;
    
   
    const d = new Date(slot.date);
    // Si l'heure est proche de minuit (ex: 23h), on rajoute quelques heures pour repasser au lendemain
    if (d.getUTCHours() === 0 && d.getHours() < 0) {
       d.setHours(d.getHours() + 5); 
    }
    
    // Extraction manuelle sans passer par ISO 
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const datePart = `${year}-${month}-${day}`;

    return {
      id: slot.id,
      title: isFull ? 'Complet' : `${slot.startTime}`,
      start: `${datePart}T${slot.startTime}`,
      end: `${datePart}T${slot.endTime}`,
    extendedProps: { booked: slot.bookedSlots, capacity: slot.capacity },
  
    backgroundColor: isFull ? '#dc3545' : '#28a745', 
    borderColor: isFull ? '#bd2130' : '#20c997',
    display: 'block'
  };
});

      this.calendarOptions = { 
        ...this.calendarOptions, 
        events: events 
      };
      
      this.loading = false;
    },
    error: (err) => {
      this.loading = false;
    }
  });
}

handleEventClick(clickInfo: any) {
  const event = clickInfo.event;
  const bookedSlots = event.extendedProps.booked;
  const capacity = event.extendedProps.capacity;
  
  if (bookedSlots !== undefined && bookedSlots < capacity) {
    this.selectedEvent = event;
    
  } else {
    alert(`Ce créneau est complet ! (${bookedSlots}/${capacity})`);
    this.selectedEvent = null;
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
          this.router.navigate(['/appointments']);
        }, 1000);
      },
      error: (err: any) => {
        alert(err.error?.message || 'Erreur réservation');
      }
    });
  }
}
