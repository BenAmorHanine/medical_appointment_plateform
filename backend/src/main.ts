import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS
  //to update
  app.enableCors({
    origin: 'http://localhost:4200',  
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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
