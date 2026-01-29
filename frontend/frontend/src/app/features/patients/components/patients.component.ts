import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../services/patient.service';
import { PatientProfile } from '../models/patient.model';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patients.component.html',
  styleUrls: ['../../doctors/components/doctors.component.scss'],
})
export class AdminPatientsComponent implements OnInit {
  patients: PatientProfile[] = [];
  loading = false;

  selectedPatient: PatientProfile | null = null; 

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.patientService.getAllPatients().subscribe({
      next: (res) => {
        this.patients = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  viewProfile(patient: PatientProfile) {
    this.selectedPatient = patient;
    window.scrollTo(0, 0);
  }

  closeProfile() {
    this.selectedPatient = null;
  }
}
