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

@Entity('patient_profiles')
export class PatientProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ unique: true })
  medicalRecordNumber: string; // Numéro de dossier (auto-généré)

  @Column({ nullable: true })
  address: string;

  // Relation OneToOne avec User
  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
