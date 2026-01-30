import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorSendNotificationComponent } from './doctor-send-notification.component';

describe('DoctorSendNotificationComponent', () => {
  let component: DoctorSendNotificationComponent;
  let fixture: ComponentFixture<DoctorSendNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSendNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorSendNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
