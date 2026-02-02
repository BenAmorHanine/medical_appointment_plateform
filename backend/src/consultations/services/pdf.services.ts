// consultations/services/pdf.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import { ConsultationEntity } from '../entities/consultation.entity';

export interface PdfNames {
  readonly doctor: string;
  readonly patient: string;
}

type PdfBuilder = (doc: PDFKit.PDFDocument) => void;

@Injectable()
export class PdfService implements OnModuleInit {
  private readonly logger = new Logger(PdfService.name);
  readonly uploadsDir = join(process.cwd(), 'uploads', 'consultations');

  async onModuleInit(): Promise<void> {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
      this.logger.log(`PDF directory ready: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error('Failed to create PDF directory', error);
      throw error;
    }
  }

  // ========================================
  // GÉNÉRATION DE FICHIERS
  // ========================================

  /**
   * Génère un nom de fichier unique
   * Format: PatientName_Date_Type.pdf
   * Exemple: JohnDoe_2024-02-02_Ordonnance.pdf
   */
  generateFilename(
    type: 'ordonnance' | 'certificat',
    consultationId: string,
    patientName: string,
    date: Date,
  ): string {
    // Nettoyer le nom du patient (enlever caractères spéciaux)
    const sanitizedName = patientName.replace(/[^a-zA-Z0-9]/g, '_');

    // Format de date lisible: YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    // Type en capitalize
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);

    return `${sanitizedName}_${dateStr}_${typeCapitalized}.pdf`;
  }

  /**
   * Génère un PDF (ou retourne le chemin s'il existe)
   */
  async generate(filename: string, builder: PdfBuilder): Promise<string> {
    const filePath = join(this.uploadsDir, filename);

    if (existsSync(filePath)) {
      this.logger.debug(`PDF exists: ${filename}`);
      return filePath;
    }

    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      try {
        builder(doc);
        doc.end();
      } catch (error) {
        stream.destroy();
        this.logger.error(`PDF generation failed: ${filename}`, error);
        reject(new InternalServerErrorException('PDF generation failed'));
        return;
      }

      stream.on('finish', () => {
        this.logger.log(`PDF created: ${filename}`);
        resolve(filePath);
      });

      stream.on('error', (error) => {
        this.logger.error(`PDF write failed: ${filename}`, error);
        reject(new InternalServerErrorException('PDF write failed'));
      });
    });
  }

  getFilePath(filename: string): string {
    return join(this.uploadsDir, filename);
  }

  fileExists(filename: string): boolean {
    return existsSync(this.getFilePath(filename));
  }

  // ========================================
  // BUILDERS PDF
  // ========================================

  /**
   * Builder pour ordonnance
   */
  buildPrescription(
    consultation: ConsultationEntity,
    names: PdfNames,
  ): PdfBuilder {
    return (doc) => {
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MEDICAL PRESCRIPTION', { align: 'center' })
        .moveDown();

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Date: ${consultation.createdAt.toLocaleDateString('en-US')}`)
        .text(
          `Type: ${consultation.type} | Duration: ${consultation.duration} min`,
        )
        .text(`Doctor: ${names.doctor}`)
        .text(`Patient: ${names.patient}`)
        .moveDown();

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PRESCRIPTIONS:', { underline: true })
        .font('Helvetica')
        .fontSize(12)
        .text(consultation.medicament || '- None')
        .moveDown(2);

      doc
        .fontSize(10)
        .text('Electronic Signature', { align: 'right' })
        .font('Helvetica-Bold')
        .text(names.doctor, { align: 'right' });
    };
  }

  /**
   * Builder pour certificat médical
   */
  buildCertificate(
    consultation: ConsultationEntity,
    names: PdfNames,
  ): PdfBuilder {
    return (doc) => {
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MEDICAL CERTIFICATE', { align: 'center' })
        .moveDown();

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(
          `I, the undersigned, ${names.doctor}, certify that I have examined:`,
        )
        .text(`Patient: ${names.patient}`)
        .text(
          `Date: ${consultation.createdAt.toLocaleDateString('en-US')} | Type: ${consultation.type}`,
        )
        .moveDown();

      if (consultation.joursRepos) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('SICK LEAVE', { underline: true })
          .font('Helvetica')
          .fontSize(12)
          .text(
            `${consultation.joursRepos} day(s) starting from ${consultation.createdAt.toLocaleDateString('en-US')}`,
          )
          .moveDown();
      }

      doc
        .moveDown()
        .fontSize(10)
        .text('Electronic Signature', { align: 'right' })
        .font('Helvetica-Bold')
        .text(names.doctor, { align: 'right' })
        .font('Helvetica')
        .text(`Date: ${consultation.createdAt.toLocaleDateString('en-US')}`, {
          align: 'right',
        });
    };
  }

  // ========================================
  // MÉTHODES DE HAUT NIVEAU
  // ========================================

  /**
   * Génère les deux PDFs pour une consultation
   */
  async generateConsultationPdfs(
    consultation: ConsultationEntity,
    names: PdfNames,
  ): Promise<void> {
    const ordonnanceFilename = this.generateFilename(
      'ordonnance',
      consultation.id,
      names.patient,
      consultation.createdAt,
    );

    const certificatFilename = this.generateFilename(
      'certificat',
      consultation.id,
      names.patient,
      consultation.createdAt,
    );

    await Promise.all([
      this.generate(
        ordonnanceFilename,
        this.buildPrescription(consultation, names),
      ),
      this.generate(
        certificatFilename,
        this.buildCertificate(consultation, names),
      ),
    ]);
  }

  /**
   * Récupère ou régénère un PDF spécifique
   */
  async getPdfPath(
    consultation: ConsultationEntity,
    names: PdfNames,
    type: 'ordonnance' | 'certificat',
  ): Promise<{ path: string; filename: string }> {
    const filename = this.generateFilename(
      type,
      consultation.id,
      names.patient,
      consultation.createdAt,
    );

    // Régénérer si manquant
    if (!this.fileExists(filename)) {
      this.logger.warn(`PDF missing, regenerating: ${filename}`);
      const builder =
        type === 'ordonnance'
          ? this.buildPrescription(consultation, names)
          : this.buildCertificate(consultation, names);

      await this.generate(filename, builder);
    }

    return {
      path: this.getFilePath(filename),
      filename,
    };
  }
}
