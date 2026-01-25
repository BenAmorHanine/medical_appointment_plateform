import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { SendContactEmailDto } from '../dto/send-contact-email.dto';

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

  async sendContactEmail(dto: SendContactEmailDto) {
    const messageData = {
      from: `Contact Form <noreply@${this.domain}>`,
      to: this.companyEmail,
      subject: `Contact Form: ${dto.subject}`,
      text: `
Name: ${dto.name}
Email: ${dto.email}
Phone: ${dto.phone || 'Not provided'}

Message:
${dto.message}
      `,
      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #007bff;">New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${dto.name}</p>
  <p><strong>Email:</strong> ${dto.email}</p>
  <p><strong>Phone:</strong> ${dto.phone || 'Not provided'}</p>
  <p><strong>Subject:</strong> ${dto.subject}</p>
  <hr>
  <h3>Message:</h3>
  <p style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
    ${dto.message.replace(/\n/g, '<br>')}
  </p>
</div>
      `,
    };

    try {
      const result = await this.mailgun.messages.create(this.domain, messageData);
      return { success: true, messageId: result.id };
    } catch (error: any) {
      // Log the actual error to your console for debugging
      console.error('Mailgun Error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}