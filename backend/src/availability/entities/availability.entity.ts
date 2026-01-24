import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { DoctorProfileEntity } from '../../profiles/doctor/entities/doctor-profile.entity';

@Entity('availabilities')
export class AvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column()
  startTime: string; 

  @Column()
  endTime: string;   

  @Column({ default: 5 })
  capacity: number;  
  @Column({ default: 5 })
  bookedSlots: number; 

  @ManyToOne(() => DoctorProfileEntity)
  doctor: DoctorProfileEntity;

  @Column()
  doctorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
