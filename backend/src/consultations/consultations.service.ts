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
import { mkdir } from 'node:fs/promises';
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
    // Si une consultation existe déjà pour ce rendez-vous, renvoyer l'existante
    if (dto.appointmentId) {
      const existing = await this.consultationRepo.findOne({ where: { appointmentId: dto.appointmentId } });
      if (existing) {
        this.logger.warn(`Consultation déjà existante pour appointment ${dto.appointmentId}, renvoi de l'existante.`);
        return existing;
      }
    }

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
const [patientProfile, doctorProfile] = await Promise.all([
  this.patientRepo.findOne({
    where: { user: { id: dto.patientId } },
    select: { id: true },
  }),
  this.doctorRepo.findOne({
    where: { id: dto.doctorProfileId },
    select: { id: true },
  }),
]);

if (!doctorProfile) {
  throw new NotFoundException('Doctor profile not found');
}




if (!patientProfile) {
  throw new NotFoundException('Patient profile not found');
}


//  Forcer l’ID correct
const consultation = await queryRunner.manager.save(
  this.consultationRepo.create({
    ...dto,
    patientId: patientProfile.id,
    doctorProfileId: doctorProfile.id,
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
      const ordonnanceFilename = this.generatePdfFilename('ordonnance', names, consultation.createdAt);
      const certificatFilename = this.generatePdfFilename('certificat', names, consultation.createdAt);
      await Promise.all([
        this.createPDF(
          ordonnanceFilename,
          this.buildOrdonnance(consultation, names),
        ),
        this.createPDF(
          certificatFilename,
          this.buildCertificat(consultation, names),
        ),
      ]);

      // Mettre à jour les URLs des PDFs
      // Au lieu d'exposer directement le chemin '/uploads/...', on sauvegarde l'URL
      // contrôlée qui servira le fichier et ajoutera Content-Disposition.
      consultation.ordonnanceUrl = `/consultations/${consultation.id}/ordonnance`;
      consultation.certificatUrl = `/consultations/${consultation.id}/certificat`;

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
   * Normalise les URLs des PDFs pour qu'elles pointent vers les endpoints contrôlés
   * (/consultations/:id/ordonnance ou /consultations/:id/certificat). Si la
   * base contient encore l'URL statique '/uploads/consultations/..', on la remplace
   * par l'URL contrôlée et on met à jour l'enregistrement en base.
   */
  private async normalizePdfUrls(consultation: ConsultationEntity): Promise<void> {
    if (!consultation) return;

    const controlledOrdonnance = `/consultations/${consultation.id}/ordonnance`;
    const controlledCertificat = `/consultations/${consultation.id}/certificat`;

    const updates: Partial<ConsultationEntity> = {};
    if (consultation.ordonnanceUrl && consultation.ordonnanceUrl.startsWith('/uploads/consultations/')) {
      updates.ordonnanceUrl = controlledOrdonnance;
    }
    if (consultation.certificatUrl && consultation.certificatUrl.startsWith('/uploads/consultations/')) {
      updates.certificatUrl = controlledCertificat;
    }

    if (Object.keys(updates).length > 0) {
      await this.consultationRepo.update(consultation.id, updates as any);
      // Reflect changes in the passed object for immediate return
      if (updates.ordonnanceUrl) consultation.ordonnanceUrl = updates.ordonnanceUrl;
      if (updates.certificatUrl) consultation.certificatUrl = updates.certificatUrl;
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

    await this.normalizePdfUrls(consultation);
    return consultation;
  }

  /**
   * Récupère toutes les consultations
   */
  async findAll(): Promise<ConsultationEntity[]> {
    const consultations = await this.consultationRepo.find({ order: { createdAt: 'DESC' } });
    // Normaliser en parallèle
    await Promise.all(consultations.map((c) => this.normalizePdfUrls(c)));
    return consultations;
  }

  /**
   * Récupère les consultations d'un médecin
   */
  async findByDoctor(doctorProfileId: string): Promise<ConsultationEntity[]> {
    const consultations = await this.consultationRepo.find({
      where: { doctorProfileId },
      order: { createdAt: 'DESC' },
    });
    await Promise.all(consultations.map((c) => this.normalizePdfUrls(c)));
    return consultations;
  }

  /**
   * Récupère les consultations d'un patient
   */
  async findByPatient(patientId: string): Promise<ConsultationEntity[]> {
    const consultations = await this.consultationRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
    await Promise.all(consultations.map((c) => this.normalizePdfUrls(c)));
    return consultations;
  }

  /**
   * Récupère le chemin d'un PDF (ordonnance ou certificat)
   */
  private async getPdfPath(
    id: string,
    field: 'ordonnanceUrl' | 'certificatUrl',
  ): Promise<{ path: string, filename: string }> {
    const consultation = await this.findOne(id);

    const names = await this.getNames(consultation.doctorProfileId, consultation.patientId);

    let pdfUrl: string;
    let filename: string;
    if (field === 'ordonnanceUrl') {
      filename = this.generatePdfFilename('ordonnance', names, consultation.createdAt);
      pdfUrl = await this.createPDF(
        filename,
        this.buildOrdonnance(consultation, names),
      );
    } else {
      filename = this.generatePdfFilename('certificat', names, consultation.createdAt);
      pdfUrl = await this.createPDF(
        filename,
        this.buildCertificat(consultation, names),
      );
    }

    // Mettre à jour l'URL dans la base si différente
    const controlledUrl = `/consultations/${consultation.id}/${field === 'ordonnanceUrl' ? 'ordonnance' : 'certificat'}`;

    if (consultation[field] !== controlledUrl) {
      await this.consultationRepo.update(consultation.id, { [field]: controlledUrl });
    }

    return { path: join(process.cwd(), pdfUrl.replace(/^\//, '')), filename };
  }

  /**
   * Récupère le chemin de l'ordonnance
   */
  async getOrdonnancePath(id: string): Promise<{ path: string, filename: string }> {
    return this.getPdfPath(id, 'ordonnanceUrl');
  }

  /**
   * Récupère le chemin du certificat médical
   */
  async getCertificatPath(id: string): Promise<{ path: string, filename: string }> {
    return this.getPdfPath(id, 'certificatUrl');
  }

  /**
   * Génère le nom de fichier pour un PDF
   */
  private generatePdfFilename(
    type: 'ordonnance' | 'certificat',
    names: Names,
    date: Date,
  ): string {
    const patientName = names.patient.replace(/\s+/g, '_');
    const dateStr = date.toISOString().split('T')[0];
    return `${type}-${patientName}-${dateStr}.pdf`;
  }
}
