import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { ContactService } from '../services/contact.service';
import { inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../../profile/profile.service';



@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private profileService = inject(ProfileService);

  user = signal<any | null>(null);
  subject = signal('');
  message = signal('');

  isSubmitting = signal(false);
  submitted = signal(false);

  ngOnInit() {
    this.profileService.getProfile().subscribe({
      next: (profile) => this.user.set(profile),
      error: (err) => console.error('Failed to load profile', err)
    });
  }

sendMessage() {
    const u = this.user();
    if (!u || !this.subject() || !this.message()) return;

    this.isSubmitting.set(true);

    const payload = {
      subject: this.subject(),
      message: this.message()
    };

    // Chapter 13: HTTP POST Request
    this.contactService.sendContactEmail(payload).subscribe({
      next: () => {
        this.submitted.set(true);
        this.subject.set('');
        this.message.set('');
      },
      error: (err) => console.error('Submission failed', err),
      complete: () => this.isSubmitting.set(false)
    });
  }

}
