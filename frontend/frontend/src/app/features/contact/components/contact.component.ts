import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ContactService } from '../services/contact.service'; // Ensure path is correct

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService // Injecting your service
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+216[0-9]{8}$/)]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      this.contactService.sendContactEmail(this.contactForm.value).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitted = true;
          this.contactForm.reset();

          // Hide success message after 5 seconds
          setTimeout(() => this.submitted = false, 5000);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Submission error:', err);
          alert('Failed to send message. Please ensure the backend is running.');
        }
      });
    }
  }
}
