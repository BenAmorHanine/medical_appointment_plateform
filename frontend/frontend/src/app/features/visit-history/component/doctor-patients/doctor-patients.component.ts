import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { VisitHistoryService } from '../../service/visit-history.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-doctor-patients',
  standalone: true,
   imports: [CommonModule],
   templateUrl: './doctor-patients.component.html',
   styleUrls: ['./doctor-patients.component.css'],

})
export class DoctorPatientsComponent implements OnInit {

  patients = signal<any[]>([]);
  page = signal(1);
  limit = 10;
  total = signal(0);
  loading = signal(true);

  Math = Math;
  constructor(
    private historyService: VisitHistoryService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.historyService
      .getDoctorPatients(this.page(), this.limit)
      .subscribe(res => {
        this.patients.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      });
  }

  next(): void {
    if (this.page() * this.limit < this.total()) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  prev(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.load();
    }
  }
/*
 openHistory(patientId: string): void {
  this.router.navigate(['/history/doctor/patient', patientId]);
}
*/
openHistory(patientId: string): void {
  console.log('➡️ Navigating with patientId:', patientId);
 sessionStorage.setItem('patientHistoryId', patientId);
  this.router.navigate(
    ['/history/doctor/patient'],
    {
      state: { patientId },
    }
  );
}


}
