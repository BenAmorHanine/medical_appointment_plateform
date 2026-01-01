import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { UserEntity } from '../../users/entities/user.entity';
import {
  AppointmentCreatedEvent,
  AppointmentCancelledEvent,
  AppointmentUpdatedEvent,
} from '../../appointments/events/appointment.events';

@Injectable()
export class NotificationListener {
  constructor(
    private notifService: NotificationsService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  @OnEvent('appointment.created')
async handleAppointmentCreated(event: AppointmentCreatedEvent) {
  try {
    console.log('🔔 Event received: appointment.created', event.appointmentId);
    console.log('📍 PatientId:', event.patientId);
    console.log('📍 DoctorId:', event.doctorId);

    // Récupérer infos patient et doctor
    const patient = await this.userRepo.findOne({
      where: { id: event.patientId },
    });
    const doctor = await this.userRepo.findOne({
      where: { id: event.doctorId },
    });

    console.log('👤 Patient trouvé:', patient?.username);
    console.log('👨‍⚕️ Doctor trouvé:', doctor?.username);

    if (!patient || !doctor) {
      console.error('❌ Patient ou Doctor introuvable');
      return;
    }

    // Créer notification pour le patient
    const notifPatient = await this.notifService.createForUser(
      event.patientId,
      '✅ Rendez-vous confirmé',
      `Votre consultation avec Dr. ${doctor.username} le ${new Date(event.appointmentDate).toLocaleDateString('fr-FR')} à ${new Date(event.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} est confirmée.`,
    );

    console.log('✅ Notification patient créée:', notifPatient.id); // ← AJOUTER

    // Créer notification pour le doctor
    const notifDoctor = await this.notifService.createForUser(
      event.doctorId,
      '📅 Nouveau rendez-vous',
      `Nouveau RDV avec ${patient.username} le ${new Date(event.appointmentDate).toLocaleDateString('fr-FR')} à ${new Date(event.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
    );

    console.log('✅ Notification doctor créée:', notifDoctor.id); // ← AJOUTER
  } catch (error) {
    console.error('❌ Error in notification listener:', error.message);
    console.error('📍 Full error:', error); // ← AJOUTER
  }
}

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(event: AppointmentCancelledEvent) {
    try {
      console.log(' Event received: appointment.cancelled', event.appointmentId);

      const patient = await this.userRepo.findOne({
        where: { id: event.patientId },
      });
      const doctor = await this.userRepo.findOne({
        where: { id: event.doctorId },
      });

      if (!patient || !doctor) return;

      // Notif patient
      await this.notifService.createForUser(
        event.patientId,
        ' Rendez-vous annulé',
        `Votre consultation avec Dr. ${doctor.username} a été annulée.`,
      );

      console.log(` Notification annulation créée pour patient ${patient.username}`);

      // Notif doctor
      await this.notifService.createForUser(
        event.doctorId,
        ' Rendez-vous annulé',
        `Le RDV avec ${patient.username} a été annulé.`,
      );

      console.log(` Notification annulation créée pour doctor ${doctor.username}`);
    } catch (error) {
      console.error(' Error in cancellation listener:', error.message);
    }
  }

  @OnEvent('appointment.updated')
  async handleAppointmentUpdated(event: AppointmentUpdatedEvent) {
    try {
      console.log(' Event received: appointment.updated', event.appointmentId);

      const patient = await this.userRepo.findOne({
        where: { id: event.patientId },
      });
      const doctor = await this.userRepo.findOne({
        where: { id: event.doctorId },
      });

      if (!patient || !doctor) return;

      // Notif patient
      await this.notifService.createForUser(
        event.patientId,
        ' Rendez-vous modifié',
        `Votre RDV avec Dr. ${doctor.username} a été modifié. Nouvelle date: ${new Date(event.appointmentDate).toLocaleDateString('fr-FR')} à ${new Date(event.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
      );

      console.log(` Notification modification créée pour patient ${patient.username}`);

      // Notif doctor
      await this.notifService.createForUser(
        event.doctorId,
        '🔄 Rendez-vous modifié',
        `Le RDV avec ${patient.username} a été modifié pour le ${new Date(event.appointmentDate).toLocaleDateString('fr-FR')}.`,
      );

      console.log(` Notification modification créée pour doctor ${doctor.username}`);
    } catch (error) {
      console.error(' Error in update listener:', error.message);
    }
  }
}