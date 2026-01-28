import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './services/contact.service';
import { ContactEmailDto } from './dto/contact-email.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact-us-email')
  async sendEmail(@Body() dto: ContactEmailDto) {
    return this.contactService.sendContactEmail(dto);
  }
}