import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DoctorProfileEntity } from '../../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../../profiles/patient/entities/patient-profile.entity';
export enum ConsultationType {
  STANDARD = 'standard',
  CONTROLE = 'controle',
  URGENCE = 'urgence',
}

@Entity('consultations')
export class ConsultationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  doctorProfileId: string;

  @Column({
    type: 'enum',
    enum: ConsultationType,
    default: ConsultationType.STANDARD,
  })
  type: ConsultationType;

  @Column({ type: 'int' })
  duration: number; // en minutes

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'text', nullable: true })
  medicament: string | null; // Médicament pour l'ordonnance

  @Column({ type: 'int', nullable: true })
  joursRepos: number | null; // Nombre de jours de repos pour le certificat

  @Column({ type: 'varchar', length: 500, nullable: true })
  ordonnanceUrl: string | null; // URL du PDF ordonnance

  @Column({ type: 'varchar', length: 500, nullable: true })
  certificatUrl: string | null; // URL du PDF certificat

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  //relation
  @ManyToOne(() => PatientProfileEntity, { eager: false })
  @JoinColumn({ name: 'patientId' })
   patient: PatientProfileEntity;
  @ManyToOne(() => DoctorProfileEntity, { eager: false })
  @JoinColumn({ name: 'doctorProfileId' })
  doctorProfile: DoctorProfileEntity;

}