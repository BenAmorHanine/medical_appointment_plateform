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

async sendContactEmail(dto: ContactEmailDto, user: any) {

  const senderName = `${user.firstName} ${user.lastName}`;
  const senderEmail = user.email;
  
  const { subject, message } = dto;

  const data = {
    from: `${senderName} <postmaster@${this.domain}>`, 
    to: this.companyEmail,
    subject: `Contact Form: ${subject}`,
    
    //makes sure when you hit "Reply" in your inbox,it goes to the user's real email address.
    'h:Reply-To': senderEmail, 
    
    html: `
      <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          New Support Message
        </h2>
        <p><strong>From:</strong> ${senderName} (${user.role})</p>
        <p><strong>Sender Email:</strong> ${senderEmail}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; font-size: 16px; line-height: 1.6;">
          ${message}
        </div>
        <footer style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">
          Sent via MedWin Platform Internal System
        </footer>
      </div>
    `,
  };

  try {
    const result = await this.mailgun.messages.create(this.domain, data);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Mailgun Error:', error);
    throw new InternalServerErrorException('Email failed to send');
  }
}

async sendNotificationEmail(dto: any) {
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    
    const messageData = {
      from: `MedWin Platform <support@${domain}>`,
      to: dto.recipientEmail,
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