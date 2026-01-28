import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { ContactEmailDto } from '../dto/contact-email.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ContactService {
  private mailgun: any;
  private domain: string;
  private companyEmail: string;

  constructor(private configService: ConfigService) {
    const mg = new Mailgun(formData);

    // .getOrThrow<string>() tells TypeScript this WILL be a string.
    // If the key is missing in .env, the app will throw an error on startup.
    this.domain = this.configService.getOrThrow<string>('MAILGUN_DOMAIN');
    this.companyEmail = this.configService.getOrThrow<string>('COMPANY_EMAIL');

    this.mailgun = mg.client({
      username: 'api',
      key: this.configService.getOrThrow<string>('MAILGUN_API_KEY'),
    });
  }


async sendContactEmail(dto: ContactEmailDto) {
  const { name, email, subject, message } = dto;

  const data = {
    from: `${name} <noreply@${this.domain}>`, 
    to: this.companyEmail,
    subject: `Contact Form: ${subject}`,
    // This ensures clicking "Reply" goes to the user
    'h:Reply-To': email, 
    html: `
      <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2c3e50;">New Message from ${name}</h2>
        <p><strong>Sender Email:</strong> ${email}</p>
        <hr />
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; fontsize:18">${message}</p>
      </div>
    `,
  };

  try {
    const result = await this.mailgun.messages.create(this.domain, data);
    return { success: true, messageId: result.id };
  } catch (error) {
    throw new InternalServerErrorException('Email failed to send');
  }
}

async sendNotificationEmail(dto: any) {
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    
    const messageData = {
      from: `MedWin Platform <support@${domain}>`,
      to: dto.recipientEmail, // Sending TO the user
      subject: `MedWin Notification: ${dto.subject}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #0056b3;">MedWin Notification</h2>
        <p>Dear ${dto.name},</p>
        <p>${dto.message}</p>
        <br>
        <p><i>Role-specific update for: ${dto.role}</i></p>
      </div>
    `
    };
    return this.mailgun.messages.create(domain, messageData);
  }
}