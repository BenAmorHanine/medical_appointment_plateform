import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../profile.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);

  // Use a signal to store user data
  // The "user" signal will hold all the info (email, role, and the nested profile)

  user = signal<any>(null);
  isEditing = signal<boolean>(false); // Toggle for Edit mode to switch between the "Display" and "Edit" views.

  ngOnInit() {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        // Clear old data and set new user from backend
        this.user.set(data);
      },
      error: (err) => console.error('Error:', err)
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
  }

  // NEW
private stripUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== ''
    )
  );
}

// UPDATED onSave()
onSave(formValue: any) {
  const payload: any = {
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    phone: formValue.phone,
  };

  if (this.user().role === 'doctor') {
    payload.specialty = formValue.specialty;
    payload.office = formValue.office;
    payload.image = formValue.image;
    payload.available = formValue.available;
    payload.consultationDuration = formValue.consultationDuration !== undefined ? Number(formValue.consultationDuration) : undefined;
    payload.consultationFee = formValue.consultationFee !== undefined ? Number(formValue.consultationFee) : undefined;
  } else {
    payload.age = formValue.age !== undefined ? Number(formValue.age) : undefined;
    payload.gender = formValue.gender;
  }

  this.profileService.updateProfile(payload).subscribe({
    next: (res) => {
      this.user.set(res);
      this.isEditing.set(false);
    },
    error: (err) => {
      console.error(err);
      alert('Update failed');
    },
  });
}

/**
   onSave(updatedData: any) {
    this.profileService.updateProfile(updatedData).subscribe({
      next: (res) => {
        this.user.set(res);
        this.isEditing.set(false);
      },
      error: (err) => alert('Update failed!')
    });
  }
    */
 /**
  onSave(formValue: any) {

    const payload = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,

      profile: {
        ...this.user().profile, // keep existing fields
        image: formValue.image, // ✅ FIX
        specialty: formValue.specialty,
        office: formValue.office,
        age: formValue.age,
        gender: formValue.gender
      }
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.user.set(res);
        this.isEditing.set(false);
      },
      error: () => alert('Update failed!')
    });
  }
    */

}
