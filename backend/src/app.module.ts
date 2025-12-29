import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { DoctorProfileModule } from './profiles/doctor/doctor-profile.module';
import { PatientProfileModule } from './profiles/patient/patient-profile.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),

    // Configuration TypeORM avec useFactory
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'), // Attention : 'database.name' ici
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // Modules
    UsersModule,
    DoctorProfileModule,
    PatientProfileModule,
  ],
})
export class AppModule {}


/**
 * 
 */