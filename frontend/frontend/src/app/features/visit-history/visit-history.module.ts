import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitHistoryComponent } from './component/visit-history/visit-history.component';
import { VisitHistoryRoutingModule } from './visit-history-routing.module';
import { DoctorPatientsComponent } from './component/doctor-patients/doctor-patients.component';

@NgModule({
  declarations: [
    
     
  ],
  imports: [
    CommonModule,
    VisitHistoryRoutingModule
  ]
})
export class VisitHistoryModule {}
