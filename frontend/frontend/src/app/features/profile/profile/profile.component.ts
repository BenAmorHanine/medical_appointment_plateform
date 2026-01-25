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

  // These are needed for the image logic
  selectedFile: File | null = null;
  previewImage: string | null = null; // Declare this for the <img> preview

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
    if (!this.isEditing()) {
      this.selectedFile = null;
      this.previewImage = null;
    }
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
//before the upload image
/*
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
}*/onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSave(formValue: any) {
    // 1. Build common identity data
    const payload: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
    };

    // 2. Build role-specific data
    if (this.user().role === 'doctor') {
      payload.specialty = formValue.specialty;
      payload.office = formValue.office;
      payload.available = formValue.available; // Don't forget availability!
      payload.consultationDuration = Number(formValue.consultationDuration);
      payload.consultationFee = Number(formValue.consultationFee);
    } else {
      payload.age = Number(formValue.age);
      payload.gender = formValue.gender;
    }

    // 3. Call service with the file
    this.profileService.updateProfile(payload, this.selectedFile || undefined).subscribe({
      next: (res) => {
        this.user.set(res);
        this.isEditing.set(false);
        this.selectedFile = null;
        this.previewImage = null;
      },
      error: (err) => {
        console.error(err);
        alert('Update failed!');
      }
    });
  }
}
