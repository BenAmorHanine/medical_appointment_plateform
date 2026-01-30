import { Component,signal ,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';

@Component({
  standalone: true,
  selector: 'app-doctor-send-notification',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-send-notification.component.html',
  styleUrls: ['./doctor-send-notification.component.css'],
})
export class DoctorSendNotificationComponent {
defaultMessage = signal('');
defaultSubject = signal('Notification from your Doctor');
loading = signal(false);

successMessage = signal('');
errorMessage = signal('');
private notificationService = inject(NotificationService);


 onTypeChange(type: string) {
  if (type === 'reminder') {
    this.defaultSubject.set('Appointment Reminder');
    this.defaultMessage.set(`Dear patient,

This is a reminder for your upcoming appointment.

Please make sure to arrive 15 minutes early.

Kind regards,
Dr.`);
  }

  if (type === 'followup') {
    this.defaultSubject.set('Follow-up Consultation');
    this.defaultMessage.set(`Dear patient,

Thank you for attending your consultation today.

Please follow the medical advice discussed during your visit.

Kind regards,
Dr.`);
  }

  if (type === 'cancel') {
    this.defaultSubject.set('Appointment Cancellation/Rescheduling');
    this.defaultMessage.set(`Dear patient,

We regret to inform you that your appointment has been cancelled or rescheduled.

Please contact us for further details.

Kind regards,
Dr.`);
  }
}


 submit(form: NgForm) {
  if (form.invalid) return;

  this.loading.set(true);
  this.successMessage.set('');
  this.errorMessage.set('');

  this.notificationService.sendNotification({
    ...form.value,
    subject: this.defaultSubject(),
    message: this.defaultMessage(),
  }).subscribe({
    next: () => {
      this.successMessage.set('Email sent successfully');
      form.resetForm({ role: 'patient' });
      this.defaultMessage.set('');
      this.defaultSubject.set('Notification from your Doctor');
      this.loading.set(false);
    },
    error: () => {
      this.errorMessage.set('Failed to send email');
      this.loading.set(false);
    },
  });
}

}
