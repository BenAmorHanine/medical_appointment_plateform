import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './services/contact.service';
import { SendContactEmailDto } from './dto/send-contact-email.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send-email')
  async sendEmail(@Body() dto: SendContactEmailDto) {
    return this.contactService.sendContactEmail(dto);
  }
}