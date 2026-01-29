import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailgun: any;
  private readonly domain: string;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    try {
      const apiKey = this.config.getOrThrow<string>('MAILGUN_API_KEY');
      this.domain = this.config.getOrThrow<string>('MAILGUN_DOMAIN');
      this.fromEmail = this.config.get<string>('MAILGUN_FROM_EMAIL') || `noreply@${this.domain}`;

      const mg = new Mailgun(formData);
      this.mailgun = mg.client({ username: 'api', key: apiKey });
      
      this.logger.log(`Mailgun initialized with domain: ${this.domain}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Mailgun: ${message}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, code: string, firstName: string): Promise<void> {
    try {
      this.logger.debug(`Sending password reset to ${email} from ${this.fromEmail}`);
      this.logger.debug(`Mailgun domain: ${this.domain}`);
      
      await this.mailgun.messages.create(this.domain, {
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset Code - Medical Appointment Platform',
        html: this.buildPasswordResetTemplate(code, firstName),
      });
      
      this.logger.log(`Password reset email sent successfully to: ${email}`);
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: (error as any)?.status,
        statusCode: (error as any)?.statusCode,
        code: (error as any)?.code,
        response: (error as any)?.response,
      };
      
      this.logger.error(`Mailgun error details: ${JSON.stringify(errorDetails)}`);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  private buildPasswordResetTemplate(code: string, name: string): string {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 28px;">🏥 Password Reset</h2>
        </div>
        
        <p style="color: #374151; font-size: 16px; margin-bottom: 10px;">Hi <strong>${name}</strong>,</p>
        
        <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
          You requested to reset your password. Use the verification code below to proceed.
        </p>

        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
          <div style="font-size: 48px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 0;">${code}</div>
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 15px 0 0 0;">Valid for 15 minutes</p>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            <strong>⚠️ Security:</strong> Never share this code. We will never ask for it.
          </p>
        </div>

        <ol style="color: #374151; font-size: 14px; line-height: 1.8;">
          <li>Copy the 6-digit code above</li>
          <li>Return to the password reset page</li>
          <li>Paste the code</li>
          <li>Create your new password</li>
        </ol>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; margin-bottom: 30px;">
          If you didn't request this, ignore this email. Your account is secure.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;">

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          © 2026 Medical Appointment Platform
        </p>
      </div>
    `;
  }
}
