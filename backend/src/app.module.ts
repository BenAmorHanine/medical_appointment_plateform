import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { DoctorProfileModule } from './profiles/doctor/doctor-profile.module';
import { PatientProfileModule } from './profiles/patient/patient-profile.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { VisitHistoryModule } from './visit-history/visit-history.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    // Configuration TypeORM avec useFactory
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // Modules
    UsersModule,
    DoctorProfileModule,
    PatientProfileModule,
    AvailabilityModule,
    AppointmentsModule,
    ConsultationsModule,
    AuthModule, 
    DashboardModule, 
    NotificationsModule,
    ProfileModule,
    VisitHistoryModule,
  ],
})
export class AppModule {}


/**
 * 
 */