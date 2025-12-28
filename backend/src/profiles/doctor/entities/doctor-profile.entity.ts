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

  @Column({ nullable: true })
  office: string; // Cabinet / localisation

  @Column({ nullable: true })
  phone: string;

  // Relation OneToOne avec User
  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
