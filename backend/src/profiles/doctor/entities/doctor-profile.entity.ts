import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../users/entities/user.entity';

@Entity('doctor_profiles')
export class DoctorProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  specialty: string;

  @Column({ type: 'int', default: 30 })
  consultationDuration: number;

  @Column({ type: 'float', default: 50.0 })
  consultationFee: number;

  @Column({ nullable: true })
  office: string; // Cabinet / localisation


    @Column({ 
    type: 'varchar', 
    length: 500, 
    default: '/assets/images/default-doctor.jpg' 
  })
  image: string;

  @Column({ 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 4.50 
  })
  rating: number;

  @Column({ 
    type: 'boolean', 
    default: true 
  })
  available: boolean;

  // Relation OneToOne avec User
  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
