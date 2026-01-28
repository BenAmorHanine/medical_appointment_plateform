import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ContactService } from '../services/contact.service';
import { inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);

  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: [''],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  isSubmitting = false;
  submitted = false;

  ngOnInit() {
    this.autoFillUserData();
  }

  autoFillUserData() {
    const user = this.authService.getCurrentUser();

    if (user) {
      this.contactForm.patchValue({
        name: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      });

      this.contactForm.get('name')?.disable();
      this.contactForm.get('email')?.disable();
      this.contactForm.get('phone')?.disable();
    }
  }

onSubmit() {
  // We use getRawValue() because name, email, and phone are DISABLED
  const payload = this.contactForm.getRawValue();

  console.log('Attempting to post to:', `${this.contactService['apiUrl']}/contact-us-email`);

  this.contactService.sendContactEmail(payload).subscribe({
    next: (res) => {
      this.submitted = true;
      this.contactForm.get('subject')?.reset();
      this.contactForm.get('message')?.reset();
    },
    error: (err) => {
      console.error('404 Debug - Full URL tried:', err.url); // THIS WILL SHOW THE WRONG URL
      alert(`Error 404: The route ${err.url} does not exist on the server.`);
    }
  });
}
}
