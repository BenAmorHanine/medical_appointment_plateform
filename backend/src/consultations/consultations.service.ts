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
      this.logger.log(`Uploads directory created: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error('Uploads directory creation error', error);
    }
  }

  /**
   * Retrieves the names of the doctor and patient in parallel
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
      doctor: doctor?.user?.username ?? 'Dr. Unknown',
      patient: patient?.user?.username ?? 'Unknown Patient',
    };
  }

  /**
   * Generic PDF generator with robust error handling
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
        this.logger.error(`PDF generation error ${fileName}`, error);
        reject(new InternalServerErrorException('PDF generation error'));
        return;
      }

      stream.on('finish', () => {
        this.logger.log(`PDF created: ${fileName}`);
        resolve(`/uploads/consultations/${fileName}`);
      });

      stream.on('error', (error) => {
        this.logger.error(`PDF write error ${fileName}`, error);
        reject(new InternalServerErrorException('PDF save error'));
      });
    });
  }

  /**
   * Prescription PDF builder
   */
  private buildOrdonnance(
    consultation: ConsultationEntity,
    names: Names,
  ): PdfBuilder {
    return (doc: PDFKit.PDFDocument) => {
      doc
        .fontSize(20)
        .text('MEDICAL PRESCRIPTION', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Date: ${consultation.createdAt.toLocaleDateString('en-US')}`)
        .text(`Type: ${consultation.type} | Duration: ${consultation.duration} min`)
        .text(`Doctor: ${names.doctor} | Patient: ${names.patient}`)
        .moveDown()
        .fontSize(14)
        .text('PRESCRIPTIONS:', { underline: true })
        .fontSize(12)
        .text(
          consultation.medicament ? `- ${consultation.medicament}` : '- None',
        )
        .moveDown()
        .text('Electronic Signature', { align: 'right' })
        .text(names.doctor, { align: 'right' });
    };
  }

  /**
   * Medical certificate PDF builder
   */
  private buildCertificat(
    consultation: ConsultationEntity,
    names: Names,
  ): PdfBuilder {
    return (doc: PDFKit.PDFDocument) => {
      doc
        .fontSize(20)
        .text('MEDICAL CERTIFICATE', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`I, the undersigned, ${names.doctor}, certify that I have examined:`)
        .text(`Patient: ${names.patient}`)
        .text(
          `Date: ${consultation.createdAt.toLocaleDateString('en-US')} | Type: ${consultation.type}`,
        )
        .moveDown();

      if (consultation.joursRepos) {
        doc
          .fontSize(14)
          .text('SICK LEAVE', { underline: true })
          .fontSize(12)
          .text(
            `${consultation.joursRepos} day(s) starting from ${consultation.createdAt.toLocaleDateString('en-US')}`,
          )
          .moveDown();
      }

      doc
        .text('Electronic Signature', { align: 'right' })
        .text(names.doctor, { align: 'right' })
        .text(`Date: ${consultation.createdAt.toLocaleDateString('en-US')}`, {
          align: 'right',
        });
    };
  }

  /**
   * Creates a consultation with transaction and PDF generation
   */
  async create(dto: CreateConsultationDto): Promise<ConsultationEntity> {
    // If a consultation already exists for this appointment, return the existing one
    if (dto.appointmentId) {
      const existing = await this.consultationRepo.findOne({ where: { appointmentId: dto.appointmentId } });
      if (existing) {
        this.logger.warn(`Consultation already exists for appointment ${dto.appointmentId}, returning existing.`);
        return existing;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const duration = dto.duration ?? this.durations[dto.type] ?? 30;

     /* // Create the consultation
      const consultation = await queryRunner.manager.save(
        this.consultationRepo.create({ ...dto, duration }),
      );*/
       //1️⃣ Retrieve patientProfile from received userId
const [patientProfile, doctorProfile] = await Promise.all([
  this.patientRepo.findOne({
    where: {  id: dto.patientId  },
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


//  Force the correct ID
const consultation = await queryRunner.manager.save(
  this.consultationRepo.create({
    ...dto,
    patientId: patientProfile.id,
    doctorProfileId: doctorProfile.id,
    duration,
  }),
);


      // Mark the appointment as done if present
      if (dto.appointmentId) {
        await queryRunner.manager.update(AppointmentEntity, dto.appointmentId, {
          status: AppointmentStatus.DONE,
        });
      }

      // Generate PDFs in parallel
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

      // Update PDF URLs
      // Instead of exposing the direct path '/uploads/...', we save the controlled URL
      // that will serve the file and add Content-Disposition.
      consultation.ordonnanceUrl = `/consultations/${consultation.id}/ordonnance`;
      consultation.certificatUrl = `/consultations/${consultation.id}/certificat`;

      await queryRunner.manager.save(consultation);
      await queryRunner.commitTransaction();

      this.logger.log(`Consultation created: ${consultation.id}`);
      return consultation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Consultation creation error', error);
      throw new InternalServerErrorException(
        'Error during consultation creation',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Normalizes PDF URLs to point to controlled endpoints
   * (/consultations/:id/ordonnance or /consultations/:id/certificat). If the
   * database still contains the static URL '/uploads/consultations/..', replace it
   * with the controlled URL and update the database record.
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
   * Retrieves a consultation by its ID
   */
  async findOne(id: string): Promise<ConsultationEntity> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    await this.normalizePdfUrls(consultation);
    return consultation;
  }

  /**
   * Retrieves all consultations
   */
  async findAll(): Promise<ConsultationEntity[]> {
    const consultations = await this.consultationRepo.find({ order: { createdAt: 'DESC' } });
    // Normalize in parallel
    await Promise.all(consultations.map((c) => this.normalizePdfUrls(c)));
    return consultations;
  }

  /**
   * Retrieves consultations by doctor
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
   * Retrieves consultations by patient
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
   * Retrieves the path of a PDF (prescription or certificate)
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

    // Update the URL in the database if different
    const controlledUrl = `/consultations/${consultation.id}/${field === 'ordonnanceUrl' ? 'ordonnance' : 'certificat'}`;

    if (consultation[field] !== controlledUrl) {
      await this.consultationRepo.update(consultation.id, { [field]: controlledUrl });
    }

    return { path: join(process.cwd(), pdfUrl.replace(/^\//, '')), filename };
  }

  /**
   * Retrieves the prescription path
   */
  async getOrdonnancePath(id: string): Promise<{ path: string, filename: string }> {
    return this.getPdfPath(id, 'ordonnanceUrl');
  }

  /**
   * Retrieves the medical certificate path
   */
  async getCertificatPath(id: string): Promise<{ path: string, filename: string }> {
    return this.getPdfPath(id, 'certificatUrl');
  }

  /**
   * Generates the filename for a PDF
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
