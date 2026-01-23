import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationEntity, ConsultationType } from './entities/consultation.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { AppointmentEntity, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(ConsultationEntity)
    private readonly repository: Repository<ConsultationEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly doctorProfileRepository: Repository<DoctorProfileEntity>,
    @InjectRepository(PatientProfileEntity)
    private readonly patientProfileRepository: Repository<PatientProfileEntity>,
  ) {}

  /**
   * Calcule la durée de consultation selon le type
   */
  private calculateDuration(type: ConsultationType): number {
    const durationMap: Record<ConsultationType, number> = {
      [ConsultationType.STANDARD]: 30,
      [ConsultationType.CONTROLE]: 15,
      [ConsultationType.URGENCE]: 45,
    };
    return durationMap[type] || 30;
  }

  /**
   * Génère le PDF de l'ordonnance
   */
  private async generateOrdonnancePDF(consultation: ConsultationEntity): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'consultations');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfFileName = `ordonnance-${consultation.id}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);

    // Récupérer les noms du médecin et du patient
    const doctorProfile = await this.doctorProfileRepository.findOne({
      where: { id: consultation.doctorId },
      relations: ['user'],
    });
    const patientProfile = await this.patientProfileRepository.findOne({
      where: { id: consultation.patientId },
      relations: ['user'],
    });

    const doctorName = doctorProfile?.user?.username || 'Dr. Inconnu';
    const patientName = patientProfile?.user?.username || 'Patient Inconnu';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('ORDONNANCE MÉDICALE', { align: 'center' });
      doc.moveDown();

      // Informations
      doc.fontSize(12);
      doc.text(`Date: ${consultation.createdAt.toLocaleDateString('fr-FR')}`);
      doc.text(`Type de consultation: ${consultation.type}`);
      doc.text(`Durée: ${consultation.duration} minutes`);
      doc.moveDown();

      doc.text(`Médecin: ${doctorName}`);
      doc.text(`Patient: ${patientName}`);
      doc.moveDown();

      // Prescriptions
      doc.fontSize(14).text('PRESCRIPTIONS:', { underline: true });
      doc.fontSize(12);
      if (consultation.medicament) {
        doc.text(`- ${consultation.medicament}`);
      } else {
        doc.text('- Aucun médicament prescrit');
      }
      doc.moveDown();

      // Signature
      doc.text('Signature électronique', { align: 'right' });
      doc.text(doctorName, { align: 'right' });

      doc.end();
      stream.on('finish', () => resolve(`/uploads/consultations/${pdfFileName}`));
      stream.on('error', reject);
    });
  }

  /**
   * Génère le PDF du certificat médical
   */
  private async generateCertificatPDF(consultation: ConsultationEntity): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'consultations');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const pdfFileName = `certificat-${consultation.id}.pdf`;
    const pdfPath = path.join(uploadsDir, pdfFileName);

    // Récupérer les noms du médecin et du patient
    const doctorProfile = await this.doctorProfileRepository.findOne({
      where: { id: consultation.doctorId },
      relations: ['user'],
    });
    const patientProfile = await this.patientProfileRepository.findOne({
      where: { id: consultation.patientId },
      relations: ['user'],
    });

    const doctorName = doctorProfile?.user?.username || 'Dr. Inconnu';
    const patientName = patientProfile?.user?.username || 'Patient Inconnu';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('CERTIFICAT MÉDICAL', { align: 'center' });
      doc.moveDown();

      // Informations
      doc.fontSize(12);
      doc.text(`Je soussigné(e), ${doctorName}, certifie avoir examiné le patient:`);
      doc.moveDown();
      doc.text(`Nom du patient: ${patientName}`);
      doc.text(`Date de consultation: ${consultation.createdAt.toLocaleDateString('fr-FR')}`);
      doc.text(`Type de consultation: ${consultation.type}`);
      doc.moveDown();

      // Jours de repos
      if (consultation.joursRepos) {
        doc.fontSize(14).text('ARRÊT DE TRAVAIL', { underline: true });
        doc.fontSize(12);
        doc.text(`Je prescris un arrêt de travail de ${consultation.joursRepos} jour(s) à compter du ${consultation.createdAt.toLocaleDateString('fr-FR')}.`);
        doc.moveDown();
      }

      // Signature
      doc.text('Signature électronique', { align: 'right' });
      doc.text(doctorName, { align: 'right' });
      doc.text(`Date: ${consultation.createdAt.toLocaleDateString('fr-FR')}`, { align: 'right' });

      doc.end();
      stream.on('finish', () => resolve(`/uploads/consultations/${pdfFileName}`));
      stream.on('error', reject);
    });
  }

  /**
   * Crée une nouvelle consultation
   */
  async create(
    createConsultationDto: CreateConsultationDto,
  ): Promise<ConsultationEntity> {
    // 1️⃣ Calculer la durée selon le type
    const duration =
      createConsultationDto.duration ||
      this.calculateDuration(createConsultationDto.type);

    // 2️⃣ Créer l'objet consultation
    const consultation = this.repository.create({
      patientId: createConsultationDto.patientId,
      doctorId: createConsultationDto.doctorId,
      type: createConsultationDto.type,
      duration,
      appointmentId: createConsultationDto.appointmentId || null,
      medicament: createConsultationDto.medicament || null,
      joursRepos: createConsultationDto.joursRepos || null,
    });

    // 3️⃣ Sauvegarder la consultation
    const savedConsultation = await this.repository.save(consultation);

    // 4️⃣ Générer les PDF
    const ordonnanceUrl = await this.generateOrdonnancePDF(savedConsultation);
    const certificatUrl = await this.generateCertificatPDF(savedConsultation);

    savedConsultation.ordonnanceUrl = ordonnanceUrl;
    savedConsultation.certificatUrl = certificatUrl;
    await this.repository.save(savedConsultation);

    // 5️⃣ ✅ MARQUER LE RENDEZ-VOUS COMME DONE
    if (createConsultationDto.appointmentId) {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: createConsultationDto.appointmentId },
      });

      if (appointment) {
        appointment.status = AppointmentStatus.DONE;
        await this.appointmentRepository.save(appointment);
      }
    }

    return savedConsultation;
  }

  /**
   * Récupère une consultation par son ID
   */
  async findOne(id: string): Promise<ConsultationEntity> {
    const consultation = await this.repository.findOne({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(
        `Consultation avec l'id ${id} introuvable`,
      );
    }

    return consultation;
  }

  /**
   * Récupère toutes les consultations
   */
  async findAll(): Promise<ConsultationEntity[]> {
    return await this.repository.find();
  }

  /**
   * Récupère toutes les consultations d'un médecin spécifique
   */
  async findByDoctor(doctorId: string): Promise<ConsultationEntity[]> {
    return await this.repository.find({
      where: { doctorId },
      order: { createdAt: 'DESC' }, // Plus récentes en premier
    });
  }

  /**
   * Récupère toutes les consultations d'un patient spécifique
   */
  async findByPatient(patientId: string): Promise<ConsultationEntity[]> {
    return await this.repository.find({
      where: { patientId },
      order: { createdAt: 'DESC' }, // Plus récentes en premier
    });
  }

  /**
   * Récupère le chemin du fichier PDF de l'ordonnance
   */
  async getOrdonnancePath(id: string): Promise<string> {
    const consultation = await this.findOne(id);

    if (!consultation.ordonnanceUrl) {
      throw new NotFoundException(
        `Ordonnance non disponible pour la consultation ${id}`,
      );
    }

    const pdfPath = path.join(
      process.cwd(),
      consultation.ordonnanceUrl.replace(/^\//, ''),
    );

    if (!fs.existsSync(pdfPath)) {
      throw new NotFoundException(`Fichier PDF introuvable: ${pdfPath}`);
    }

    return pdfPath;
  }

  /**
   * Récupère le chemin du fichier PDF du certificat
   */
  async getCertificatPath(id: string): Promise<string> {
    const consultation = await this.findOne(id);

    if (!consultation.certificatUrl) {
      throw new NotFoundException(
        `Certificat non disponible pour la consultation ${id}`,
      );
    }

    const pdfPath = path.join(
      process.cwd(),
      consultation.certificatUrl.replace(/^\//, ''),
    );

    if (!fs.existsSync(pdfPath)) {
      throw new NotFoundException(`Fichier PDF introuvable: ${pdfPath}`);
    }

    return pdfPath;
  }
}

