import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ConsultationEntity,
  ConsultationType,
} from './entities/consultation.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import {
  AppointmentEntity,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { createWriteStream } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';

interface Names {
  readonly doctor: string;
  readonly patient: string;
}

type PdfBuilder = (doc: PDFKit.PDFDocument) => void;

@Injectable()
export class ConsultationsService implements OnModuleInit {
  private readonly logger = new Logger(ConsultationsService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'consultations');

  private readonly durations: Readonly<Record<ConsultationType, number>> = {
    [ConsultationType.STANDARD]: 30,
    [ConsultationType.CONTROLE]: 15,
    [ConsultationType.URGENCE]: 45,
  } as const;

  constructor(
    @InjectRepository(ConsultationEntity)
    private readonly consultationRepo: Repository<ConsultationEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly doctorRepo: Repository<DoctorProfileEntity>,
    @InjectRepository(PatientProfileEntity)
    private readonly patientRepo: Repository<PatientProfileEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
      this.logger.log(`Répertoire uploads créé: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error('Erreur création répertoire uploads', error);
    }
  }

  /**
   * Récupère les noms du médecin et du patient en parallèle
   */
  private async getNames(
    doctorProfileId: string,
    patientId: string,
  ): Promise<Names> {
    const [doctor, patient] = await Promise.all([
      this.doctorRepo.findOne({
        where: { id: doctorProfileId },
        relations: { user: true },
      }),
      this.patientRepo.findOne({
        where: { id: patientId },
        relations: { user: true },
      }),
    ]);

    return {
      doctor: doctor?.user?.username ?? 'Dr. Inconnu',
      patient: patient?.user?.username ?? 'Patient Inconnu',
    };
  }

  /**
   * Générateur PDF générique avec gestion d'erreurs robuste
   */
  private async createPDF(
    fileName: string,
    builder: PdfBuilder,
  ): Promise<string> {
    const filePath = join(this.uploadsDir, fileName);

    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      try {
        builder(doc);
        doc.end();
      } catch (error) {
        stream.destroy();
        this.logger.error(`Erreur génération PDF ${fileName}`, error);
        reject(new InternalServerErrorException('Erreur génération PDF'));
        return;
      }

      stream.on('finish', () => {
        this.logger.log(`PDF créé: ${fileName}`);
        resolve(`/uploads/consultations/${fileName}`);
      });

      stream.on('error', (error) => {
        this.logger.error(`Erreur écriture PDF ${fileName}`, error);
        reject(new InternalServerErrorException('Erreur sauvegarde PDF'));
      });
    });
  }

  /**
   * Construction du PDF d'ordonnance
   */
  private buildOrdonnance(
    consultation: ConsultationEntity,
    names: Names,
  ): PdfBuilder {
    return (doc: PDFKit.PDFDocument) => {
      doc
        .fontSize(20)
        .text('ORDONNANCE MÉDICALE', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Date: ${consultation.createdAt.toLocaleDateString('fr-FR')}`)
        .text(`Type: ${consultation.type} | Durée: ${consultation.duration}min`)
        .text(`Médecin: ${names.doctor} | Patient: ${names.patient}`)
        .moveDown()
        .fontSize(14)
        .text('PRESCRIPTIONS:', { underline: true })
        .fontSize(12)
        .text(
          consultation.medicament ? `- ${consultation.medicament}` : '- Aucun',
        )
        .moveDown()
        .text('Signature électronique', { align: 'right' })
        .text(names.doctor, { align: 'right' });
    };
  }

  /**
   * Construction du PDF de certificat médical
   */
  private buildCertificat(
    consultation: ConsultationEntity,
    names: Names,
  ): PdfBuilder {
    return (doc: PDFKit.PDFDocument) => {
      doc
        .fontSize(20)
        .text('CERTIFICAT MÉDICAL', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Je soussigné(e), ${names.doctor}, certifie avoir examiné:`)
        .text(`Patient: ${names.patient}`)
        .text(
          `Date: ${consultation.createdAt.toLocaleDateString('fr-FR')} | Type: ${consultation.type}`,
        )
        .moveDown();

      if (consultation.joursRepos) {
        doc
          .fontSize(14)
          .text('ARRÊT DE TRAVAIL', { underline: true })
          .fontSize(12)
          .text(
            `${consultation.joursRepos} jour(s) à compter du ${consultation.createdAt.toLocaleDateString('fr-FR')}`,
          )
          .moveDown();
      }

      doc
        .text('Signature électronique', { align: 'right' })
        .text(names.doctor, { align: 'right' })
        .text(`Date: ${consultation.createdAt.toLocaleDateString('fr-FR')}`, {
          align: 'right',
        });
    };
  }

  /**
   * Création d'une consultation avec transaction et génération des PDFs
   */
  async create(dto: CreateConsultationDto): Promise<ConsultationEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const duration = dto.duration ?? this.durations[dto.type] ?? 30;

     /* // Créer la consultation
      const consultation = await queryRunner.manager.save(
        this.consultationRepo.create({ ...dto, duration }),
      );*/
       //1️⃣ Récupérer le patientProfile depuis le userId reçu
const patientProfile = await this.patientRepo.findOne({
  where: { user: { id: dto.patientId } },
});


const doctorProfile = await this.doctorRepo.findOne({
  where: { id: dto.doctorProfileId },
});


if (!doctorProfile) {
  throw new NotFoundException('Doctor profile not found');
}




if (!patientProfile) {
  throw new NotFoundException('Patient profile not found');
}


// 2️⃣ Forcer l’ID correct
const consultation = await queryRunner.manager.save(
  this.consultationRepo.create({
    ...dto,
    patientId: patientProfile.id,
    doctorProfileId: doctorProfile.id, // ✅ PROFILE ID
    duration,
  }),
);


      // Marquer le rendez-vous comme terminé si présent
      if (dto.appointmentId) {
        await queryRunner.manager.update(AppointmentEntity, dto.appointmentId, {
          status: AppointmentStatus.DONE,
        });
      }

      // Générer les PDFs en parallèle
      const names = await this.getNames(dto.doctorProfileId, dto.patientId);
      const [ordonnanceUrl, certificatUrl] = await Promise.all([
        this.createPDF(
          `ordonnance-${consultation.id}.pdf`,
          this.buildOrdonnance(consultation, names),
        ),
        this.createPDF(
          `certificat-${consultation.id}.pdf`,
          this.buildCertificat(consultation, names),
        ),
      ]);

      // Mettre à jour les URLs des PDFs
      consultation.ordonnanceUrl = ordonnanceUrl;
      consultation.certificatUrl = certificatUrl;

      await queryRunner.manager.save(consultation);
      await queryRunner.commitTransaction();

      this.logger.log(`Consultation créée: ${consultation.id}`);
      return consultation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Erreur création consultation', error);
      throw new InternalServerErrorException(
        'Erreur lors de la création de la consultation',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Récupère une consultation par son ID
   */
  async findOne(id: string): Promise<ConsultationEntity> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} introuvable`);
    }

    return consultation;
  }

  /**
   * Récupère toutes les consultations
   */
  async findAll(): Promise<ConsultationEntity[]> {
    return this.consultationRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Récupère les consultations d'un médecin
   */
  async findByDoctor(doctorProfileId: string): Promise<ConsultationEntity[]> {
    return this.consultationRepo.find({
      where: { doctorProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère les consultations d'un patient
   */
  async findByPatient(patientId: string): Promise<ConsultationEntity[]> {
    return this.consultationRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère le chemin d'un PDF (ordonnance ou certificat)
   */
  private async getPdfPath(
    id: string,
    field: 'ordonnanceUrl' | 'certificatUrl',
  ): Promise<string> {
    const consultation = await this.findOne(id);

    if (!consultation[field]) {
      throw new NotFoundException(`${field} non disponible`);
    }

    const pdfPath = join(process.cwd(), consultation[field].replace(/^\//, ''));

    try {
      await access(pdfPath);
      return pdfPath;
    } catch {
      this.logger.error(`PDF introuvable: ${pdfPath}`);
      throw new NotFoundException('Fichier PDF introuvable sur le serveur');
    }
  }

  /**
   * Récupère le chemin de l'ordonnance
   */
  async getOrdonnancePath(id: string): Promise<string> {
    return this.getPdfPath(id, 'ordonnanceUrl');
  }

  /**
   * Récupère le chemin du certificat médical
   */
  async getCertificatPath(id: string): Promise<string> {
    return this.getPdfPath(id, 'certificatUrl');
  }
}
