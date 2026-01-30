import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DoctorNotificationRoutingModule } from './doctor-notification-routing.module';
import { DoctorSendNotificationComponent } from './components/doctor-send-notification/doctor-send-notification.component';
import { NotificationService } from './services/notification.service';

@NgModule({
  declarations: [
    DoctorSendNotificationComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    DoctorNotificationRoutingModule,
  ],
 
})
export class DoctorNotificationModule {}
