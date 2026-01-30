import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @Column({ nullable: true })
  patientId: string;

  @Column({ nullable: false })
  availabilityId: string;

  @CreateDateColumn()
  createdAt: Date;
 
  @Column({ type: 'text', nullable: true })
  patientNote: string;
  
  @Column({ type: 'text', nullable: true }) 
  documentUrl: string;
  
}
