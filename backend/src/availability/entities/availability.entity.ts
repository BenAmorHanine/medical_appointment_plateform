import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { DoctorProfileEntity } from '../../profiles/doctor/entities/doctor-profile.entity';

@Entity('availabilities')
export class AvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column()
  startTime: string; // "09:00"

  @Column()
  endTime: string;   // "10:00"

  @Column({ default: 5 })
  capacity: number;  // Places disponibles

  @Column({ default: 5 })
  bookedSlots: number; // Places prises

  @ManyToOne(() => DoctorProfileEntity)
  doctor: DoctorProfileEntity;

  @Column()
  doctorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
