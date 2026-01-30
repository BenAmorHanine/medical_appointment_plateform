import { Component } from '@angular/core';
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
  successMessage = '';
  errorMessage = '';
  loading = false;

  // 👇 message pré-rempli
  defaultMessage = '';

  constructor(private notificationService: NotificationService) {}

  onTypeChange(type: string) {
    if (type === 'reminder') {
      this.defaultMessage =
        `Dear patient,

This is a reminder for your upcoming appointment.

Please make sure to arrive 15 minutes early.

Kind regards,
Dr.`;
    }

    if (type === 'followup') {
      this.defaultMessage =
        `Dear patient,

Thank you for attending your consultation today.

Please follow the medical advice discussed during your visit.

Kind regards,
Dr.`;
    }

    if (type === 'cancel') {
      this.defaultMessage =
        `Dear patient,

We regret to inform you that your appointment has been cancelled or rescheduled.

Please contact us for further details.

Kind regards,
Dr.`;
    }
  }

  submit(form: NgForm) {
    if (form.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.notificationService.sendNotification(form.value).subscribe({
      next: () => {
        this.successMessage = 'Email sent successfully ✔️';
        form.resetForm({ role: 'patient' });
        this.defaultMessage = '';
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to send email ❌';
        this.loading = false;
      },
    });
  }
}
