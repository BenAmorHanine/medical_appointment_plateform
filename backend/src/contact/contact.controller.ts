import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './services/contact.service';
import { ContactEmailDto } from './dto/contact-email.dto';
import { SendNotificationEmailDto } from './dto/send-notification-email.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact-us-email')
  @UseGuards(AuthGuard('jwt'))
  async sendEmail(@Body() dto: ContactEmailDto) {
    return this.contactService.sendContactEmail(dto);
  }

  @Post('send-notification')
  @UseGuards(AuthGuard('jwt'))
  async sendNotification(@Body() dto: SendNotificationEmailDto) {
    return this.contactService.sendNotificationEmail(dto);
  }
}