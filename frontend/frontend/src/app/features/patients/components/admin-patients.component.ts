import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../services/patient.service';
import { PatientProfile } from '../models/patient.model';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-patients.component.html',
  styleUrls: [
    '../../doctors/components/doctors.component.scss'
  ],
})
export class AdminPatientsComponent implements OnInit {
  patients: PatientProfile[] = [];
  loading = false;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loading = true;

    this.patientService.getAllPatients().subscribe({
      next: (res) => {
        this.patients = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
