import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Use cookie parser for secure session management
  app.use(cookieParser());
  
  // CORS with credentials support
  app.enableCors({
    origin: 'http://localhost:4200',  
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir les fichiers statiques pour les PDFs
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  
  // Port
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application démarrée sur le port ${port}`);
}
bootstrap();
