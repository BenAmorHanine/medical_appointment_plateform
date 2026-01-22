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

  onSave(updatedData: any) {
    this.profileService.updateProfile(updatedData).subscribe({
      next: (res) => {
        this.user.set(res);
        this.isEditing.set(false);
      },
      error: (err) => alert('Update failed!')
    });
  }

}
