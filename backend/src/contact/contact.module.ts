import { Module } from '@nestjs/common';
import { ContactService } from './services/contact.service';
import { ContactController } from './contact.controller';

@Module({
    controllers: [ContactController],
    providers: [ContactService],
    exports: [ContactService],
})
export class ContactModule {}
