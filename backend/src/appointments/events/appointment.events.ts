export class AppointmentCreatedEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: Date,
  ) {}
}

export class AppointmentCancelledEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
  ) {}
}

export class AppointmentUpdatedEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: Date,
  ) {}
}