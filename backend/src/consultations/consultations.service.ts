import {
  Injectable, NotFoundException, InternalServerErrorException, Logger, BadRequestException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
//DataSource : obligatoire pour créer des transactions
import { ConsultationEntity, ConsultationType, } from './entities/consultation.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { AppointmentStatus, } from '../appointments/entities/appointment.entity';
import { PdfService, PdfNames } from './services/pdf.services';
import { DoctorProfileService } from '../profiles/doctor/doctor-profile.service';
import { PatientProfileService } from '../profiles/patient/patient-profile.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  private readonly durations: Readonly<Record<ConsultationType, number>> = {
    [ConsultationType.STANDARD]: 30,
    [ConsultationType.CONTROLE]: 15,
    [ConsultationType.URGENCE]: 45,
  } as const;

  constructor(
    @InjectRepository(ConsultationEntity)
    private readonly consultationRepo: Repository<ConsultationEntity>,
    private readonly dataSource: DataSource,
    private readonly pdfService: PdfService,
    private readonly doctorProfileService: DoctorProfileService,
    private readonly patientProfileService: PatientProfileService,
    private readonly appointmentsService: AppointmentsService,
  ) { }

  /**
   * Valide et récupère les noms pour les PDFs
   */
  private async getProfileNames(
    doctorProfileId: string,
    patientId: string,
  ): Promise<PdfNames> {
    const [doctor, patient] = await Promise.all([
      this.doctorProfileService.findOne(doctorProfileId),
      this.patientProfileService.findOne(patientId),
    ]);

    return {
      doctor: doctor.user?.username ?? 'Dr. Unknown',
      patient: patient.user?.username ?? 'Unknown Patient',
    };
  }

  /**
   * Crée une consultation avec génération des PDFs
   */
  async create(dto: CreateConsultationDto): Promise<ConsultationEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validation et récupération des noms
      const names = await this.getProfileNames(
        dto.doctorProfileId,
        dto.patientId,
      );

      // Calcul de la durée
      const duration = dto.duration ?? this.durations[dto.type] ?? 30;

      // Création de la consultation
      const consultation = await queryRunner.manager.save(
        this.consultationRepo.create({ ...dto, duration }),
      );

      // Génératiaon des PDFs
      await this.pdfService.generateConsultationPdfs(consultation, names);

      // Mise à jour des URLs dans la consultation
      consultation.ordonnanceUrl = `/consultations/${consultation.id}/ordonnance`;
      consultation.certificatUrl = `/consultations/${consultation.id}/certificat`;

      await queryRunner.manager.save(consultation);

      // Mise à jour du rendez-vous si présent - DANS la transaction
      /**Petite duplication justifiée : Lorsqu'on crée une consultation, on met à jour le statut du RDV manuellement (UPDATE appointments ...) au lieu d'appeler appointmentsService.markAsDone().
Pourquoi ? C'est nécessaire pour inclure cette action dans la Transaction. Si la création échoue, la mise à jour du RDV s'annule aussi. C'est une bonne pratique de sécurité des données. */
      if (dto.appointmentId) {
        await queryRunner.manager.update(
          'appointments',
          { id: dto.appointmentId },
          { status: AppointmentStatus.DONE },
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Consultation created: ${consultation.id}`);
      return consultation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Consultation creation failed', error);

      // Gestion de la contrainte unique (duplicate key)
      if (error.code === '23505' && dto.appointmentId) {
        this.logger.warn(
          `Consultation already exists for appointment ${dto.appointmentId}`,
        );
        const existing = await this.consultationRepo.findOne({
          where: { appointmentId: dto.appointmentId },
        });
        if (existing) return existing;
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create consultation');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Récupère le chemin d'un PDF (ordonnance ou certificat)
   */
  async getPdfPath(
    id: string,
    type: 'ordonnance' | 'certificat',
  ): Promise<{ path: string; filename: string }> {
    const consultation = await this.findOne(id);

    const names: PdfNames = {
      doctor: consultation.doctorProfile?.user?.username ?? 'Dr. Unknown',
      patient: consultation.patient?.user?.username ?? 'Unknown Patient',
    };

    return this.pdfService.getPdfPath(consultation, names, type);
  }

  /**
   * Prépare un fichier PDF pour le téléchargement
   */
  async servePdfFile(
    id: string,
    type: 'ordonnance' | 'certificat',
  ): Promise<{ path: string; filename: string }> {
    return this.getPdfPath(id, type);
  }

  async findOne(id: string): Promise<ConsultationEntity> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
      relations: { doctorProfile: { user: true }, patient: { user: true } },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    return consultation;
  }

  async findAll(
    query?: PaginationQueryDto,
  ): Promise<{ data: ConsultationEntity[]; total: number; page: number; limit: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = query ? query.skip : (page - 1) * limit;

    const [data, total] = await this.consultationRepo.findAndCount({
      relations: { doctorProfile: { user: true }, patient: { user: true } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findByDoctor(doctorProfileId: string): Promise<ConsultationEntity[]> {
    return this.consultationRepo.find({
      where: { doctorProfileId },
      relations: { patient: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<ConsultationEntity[]> {
    return this.consultationRepo.find({
      where: { patientId },
      relations: { doctorProfile: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }
}
