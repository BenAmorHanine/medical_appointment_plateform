import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS
  //to update
  app.enableCors();

  // Port
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application démarrée sur le port ${port}`);
}
bootstrap();
