import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
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
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

@Injectable()
export class ConsultationsService {
  private readonly UPLOADS_DIR = path.join(
    process.cwd(),
    'uploads',
    'consultations',
  );
  private readonly DURATIONS: Record<ConsultationType, number> = {
    [ConsultationType.STANDARD]: 30,
    [ConsultationType.CONTROLE]: 15,
    [ConsultationType.URGENCE]: 45,
  };

  constructor(
    @InjectRepository(ConsultationEntity)
    private repo: Repository<ConsultationEntity>,
    @InjectRepository(AppointmentEntity)
    private appointmentRepo: Repository<AppointmentEntity>,
    @InjectRepository(DoctorProfileEntity)
    private doctorRepo: Repository<DoctorProfileEntity>,
    @InjectRepository(PatientProfileEntity)
    private patientRepo: Repository<PatientProfileEntity>,
    private dataSource: DataSource,
  ) {
    fsPromises
      .mkdir(this.UPLOADS_DIR, { recursive: true })
      .catch(console.error);
  }

  // Charge les noms du médecin et patient en 1 requête
  private async getNames(doctorProfileId: string, patientId: string) {
    const [doctor, patient] = await Promise.all([
      this.doctorRepo.findOne({
        where: { id: doctorProfileId },
        relations: ['user'],
      }),
      this.patientRepo.findOne({
        where: { id: patientId },
        relations: ['user'],
      }),
    ]);
    return {
      doctor: doctor?.user?.username || 'Dr. Inconnu',
      patient: patient?.user?.username || 'Patient Inconnu',
    };
  }

  // Générateur PDF générique
  private async createPDF(
    fileName: string,
    builder: (doc: typeof PDFDocument) => void,
  ): Promise<string> {
    const filePath = path.join(this.UPLOADS_DIR, fileName);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      builder(doc);
      doc.end();
      stream.on('finish', () => resolve(`/uploads/consultations/${fileName}`));
      stream.on('error', reject);
    });
  }

  // Ordonnance PDF
  private buildOrdonnance(
    c: ConsultationEntity,
    names: { doctor: string; patient: string },
  ) {
    return (doc: typeof PDFDocument) => {
      doc
        .fontSize(20)
        .text('ORDONNANCE MÉDICALE', { align: 'center' })
        .moveDown();
      doc
        .fontSize(12)
        .text(`Date: ${c.createdAt.toLocaleDateString('fr-FR')}`)
        .text(`Type: ${c.type} | Durée: ${c.duration}min`)
        .text(`Médecin: ${names.doctor} | Patient: ${names.patient}`)
        .moveDown()
        .fontSize(14)
        .text('PRESCRIPTIONS:', { underline: true })
        .fontSize(12)
        .text(c.medicament ? `- ${c.medicament}` : '- Aucun')
        .moveDown()
        .text('Signature électronique', { align: 'right' })
        .text(names.doctor, { align: 'right' });
    };
  }

  // Certificat PDF
  private buildCertificat(
    c: ConsultationEntity,
    names: { doctor: string; patient: string },
  ) {
    return (doc: typeof PDFDocument) => {
      doc
        .fontSize(20)
        .text('CERTIFICAT MÉDICAL', { align: 'center' })
        .moveDown();
      doc
        .fontSize(12)
        .text(`Je soussigné(e), ${names.doctor}, certifie avoir examiné:`)
        .text(`Patient: ${names.patient}`)
        .text(
          `Date: ${c.createdAt.toLocaleDateString('fr-FR')} | Type: ${c.type}`,
        )
        .moveDown();

      if (c.joursRepos) {
        doc
          .fontSize(14)
          .text('ARRÊT DE TRAVAIL', { underline: true })
          .fontSize(12)
          .text(
            `${c.joursRepos} jour(s) à compter du ${c.createdAt.toLocaleDateString('fr-FR')}`,
          )
          .moveDown();
      }

      doc
        .text('Signature électronique', { align: 'right' })
        .text(names.doctor, { align: 'right' })
        .text(`Date: ${c.createdAt.toLocaleDateString('fr-FR')}`, {
          align: 'right',
        });
    };
  }

  // Création avec transaction
  async create(dto: CreateConsultationDto): Promise<ConsultationEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const duration = (dto.duration || this.DURATIONS[dto.type]) ?? 30;
/*
      // Créer consultation
      const consultation = await qr.manager.save(
        this.repo.create({ ...dto, duration }),
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
const consultation = await qr.manager.save(
  this.repo.create({
    ...dto,
    patientId: patientProfile.id,
    doctorProfileId: doctorProfile.id, // ✅ PROFILE ID
    duration,
  }),
);


      // Marquer RDV comme terminé
      if (dto.appointmentId) {
        await qr.manager.update(AppointmentEntity, dto.appointmentId, {
          status: AppointmentStatus.DONE,
        });
      }

      // Générer PDFs en parallèle
      const names = await this.getNames(consultation.doctorProfileId,
  consultation.patientId,);
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

      consultation.ordonnanceUrl = ordonnanceUrl;
      consultation.certificatUrl = certificatUrl;

      await qr.manager.save(consultation);
      await qr.commitTransaction();

      return consultation;
    } catch (error) {
      await qr.rollbackTransaction();
      console.error('Erreur détail:', error); // affiche l'erreur réelle
      throw new InternalServerErrorException('Erreur création consultation');
    } finally {
      await qr.release();
    }
  }

  async findOne(id: string): Promise<ConsultationEntity> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Consultation ${id} introuvable`);
    return c;
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByDoctor(doctorProfileId: string) {
    return this.repo.find({
      where: { doctorProfileId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPatient(patientId: string) {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  private async getPdfPath(
    id: string,
    field: 'ordonnanceUrl' | 'certificatUrl',
  ): Promise<string> {
    const c = await this.findOne(id);
    if (!c[field]) throw new NotFoundException(`${field} non disponible`);

    const pdfPath = path.join(process.cwd(), c[field].replace(/^\//, ''));
    try {
      await fsPromises.access(pdfPath);
      return pdfPath;
    } catch {
      throw new NotFoundException('Fichier PDF introuvable');
    }
  }

  async getOrdonnancePath(id: string) {
    return this.getPdfPath(id, 'ordonnanceUrl');
  }

  async getCertificatPath(id: string) {
    return this.getPdfPath(id, 'certificatUrl');
  }
}