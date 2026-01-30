import { Component, inject, OnInit, signal } from '@angular/core';
import { ProfileService } from '../profile.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);


  user = signal<any>(null);//"user" signal to hold user info (email, role, and the nested profile)
  isEditing = signal<boolean>(false); //switch between the "Display" and "Edit" views.

  //image logic
  selectedFile: File | null = null;
  previewImage: string | null = null; // Declare this for the <img> preview

  get apiUrl(): string {
    return environment.apiUrl;
  }

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

private stripUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== ''
    )
  );
}

onFileSelected(event: any) {
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
    //Build common identity data
    const payload: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
    };

    // Build role-specific data
    if (this.user().role === 'doctor') {
      payload.specialty = formValue.specialty;
      payload.office = formValue.office;
      payload.available = formValue.available;
      payload.consultationDuration = Number(formValue.consultationDuration);
      payload.consultationFee = Number(formValue.consultationFee);
    } else {
      payload.age = Number(formValue.age);
      payload.gender = formValue.gender;
    }

    //Call service with the file
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
