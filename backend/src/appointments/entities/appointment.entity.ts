import { DoctorProfileEntity } from 'src/profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from 'src/profiles/patient/entities/patient-profile.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum AppointmentStatus {
  RESERVED = 'reserved',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

@Entity('appointments')
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentDate: Date;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

    @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.RESERVED
    })
    status: AppointmentStatus;

  @ManyToOne(() => PatientProfileEntity)
  @JoinColumn({ name: 'patientId' })
  patient: PatientProfileEntity;

  @Column()
  patientId: string; 


  @ManyToOne(() => DoctorProfileEntity)
  @JoinColumn({ name: 'doctorId' })
  doctor: DoctorProfileEntity;

  @Column()
  doctorId: string;
  
  @Column({ nullable: false })
  availabilityId: string;

  @CreateDateColumn()
  createdAt: Date;
 
  @Column({ type: 'text', nullable: true })
  patientNote: string;
  
  @Column({ type: 'text', nullable: true }) 
  documentUrl: string;



  
}
