import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity, UserGender } from '../profiles/patient/entities/patient-profile.entity';
import { AvailabilityEntity } from '../availability/entities/availability.entity';
import { AppointmentEntity, AppointmentStatus } from '../appointments/entities/appointment.entity';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

async function seed() {
  // Create data source connection
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medical_appointment',
    entities: [
      UserEntity,
      DoctorProfileEntity,
      PatientProfileEntity,
      AvailabilityEntity,
      AppointmentEntity,
    ],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(UserEntity);
    const doctorProfileRepository = dataSource.getRepository(DoctorProfileEntity);
    const patientProfileRepository = dataSource.getRepository(PatientProfileEntity);
    const availabilityRepository = dataSource.getRepository(AvailabilityEntity);
    const appointmentRepository = dataSource.getRepository(AppointmentEntity);

    // Find the doctor user
    const doctorUser = await userRepository.findOne({
      where: { email: 'melkimariem150@gmail.com' },
      relations: [],
    });

    if (!doctorUser) {
      console.error('Doctor user not found with email: melkimariem150@gmail.com');
      process.exit(1);
    }

    console.log(`Found doctor user: ${doctorUser.username} (${doctorUser.id})`);

    // Find the doctor profile
    let doctorProfile = await doctorProfileRepository
      .createQueryBuilder('doctorProfile')
      .leftJoinAndSelect('doctorProfile.user', 'user')
      .where('user.id = :userId', { userId: doctorUser.id })
      .getOne();

    if (!doctorProfile) {
      console.error('Doctor profile not found for user');
      process.exit(1);
    }

    console.log(`Found doctor profile: ${doctorProfile.id}`);

    // Create patient users (augmenté à 15 patients)
    const patientData = [
      {
        username: 'patient1',
        email: 'patient1@example.com',
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        phone: '+216 12 345 678',
        password: 'patient123',
      },
      {
        username: 'patient2',
        email: 'patient2@example.com',
        firstName: 'Fatima',
        lastName: 'Trabelsi',
        phone: '+216 23 456 789',
        password: 'patient123',
      },
      {
        username: 'patient3',
        email: 'patient3@example.com',
        firstName: 'Mohamed',
        lastName: 'Slimani',
        phone: '+216 34 567 890',
        password: 'patient123',
      },
      {
        username: 'patient4',
        email: 'patient4@example.com',
        firstName: 'Salma',
        lastName: 'Khelifi',
        phone: '+216 45 678 901',
        password: 'patient123',
      },
      {
        username: 'patient5',
        email: 'patient5@example.com',
        firstName: 'Youssef',
        lastName: 'Ammar',
        phone: '+216 56 789 012',
        password: 'patient123',
      },
      {
        username: 'patient6',
        email: 'patient6@example.com',
        firstName: 'Amina',
        lastName: 'Bouazizi',
        phone: '+216 67 890 123',
        password: 'patient123',
      },
      {
        username: 'patient7',
        email: 'patient7@example.com',
        firstName: 'Karim',
        lastName: 'Mansouri',
        phone: '+216 78 901 234',
        password: 'patient123',
      },
      {
        username: 'patient8',
        email: 'patient8@example.com',
        firstName: 'Leila',
        lastName: 'Jemai',
        phone: '+216 89 012 345',
        password: 'patient123',
      },
      {
        username: 'patient9',
        email: 'patient9@example.com',
        firstName: 'Omar',
        lastName: 'Fadhel',
        phone: '+216 90 123 456',
        password: 'patient123',
      },
      {
        username: 'patient10',
        email: 'patient10@example.com',
        firstName: 'Nour',
        lastName: 'Hamdi',
        phone: '+216 11 234 567',
        password: 'patient123',
      },
      {
        username: 'patient11',
        email: 'patient11@example.com',
        firstName: 'Sami',
        lastName: 'Boukhris',
        phone: '+216 22 345 678',
        password: 'patient123',
      },
      {
        username: 'patient12',
        email: 'patient12@example.com',
        firstName: 'Hiba',
        lastName: 'Chaabane',
        phone: '+216 33 456 789',
        password: 'patient123',
      },
      {
        username: 'patient13',
        email: 'patient13@example.com',
        firstName: 'Tarek',
        lastName: 'Mezzi',
        phone: '+216 44 567 890',
        password: 'patient123',
      },
      {
        username: 'patient14',
        email: 'patient14@example.com',
        firstName: 'Ines',
        lastName: 'Guesmi',
        phone: '+216 55 678 901',
        password: 'patient123',
      },
      {
        username: 'patient15',
        email: 'patient15@example.com',
        firstName: 'Mehdi',
        lastName: 'Saidi',
        phone: '+216 66 789 012',
        password: 'patient123',
      },
    ];

    const createdPatients: UserEntity[] = [];

    for (const patientInfo of patientData) {
      // Check if patient already exists
      let patientUser = await userRepository.findOne({
        where: { email: patientInfo.email },
      });

      if (!patientUser) {
        // Hash password before creating
        const hashedPassword = await bcrypt.hash(patientInfo.password, 12);
        
        patientUser = userRepository.create({
          username: patientInfo.username,
          email: patientInfo.email,
          firstName: patientInfo.firstName,
          lastName: patientInfo.lastName,
          phone: patientInfo.phone,
          password: hashedPassword,
          role: UserRole.PATIENT,
        });

        patientUser = await userRepository.save(patientUser);
        console.log(`Created patient user: ${patientUser.username}`);

        // Create patient profile
        const medicalRecordNumber = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const patientProfile = patientProfileRepository.create({
          user: patientUser,
          age: Math.floor(Math.random() * 50) + 20, // Age between 20-70
          gender: Math.random() > 0.5 ? UserGender.MALE : UserGender.FEMALE,
          medicalRecordNumber,
          address: `Address for ${patientInfo.firstName} ${patientInfo.lastName}`,
        });

        await patientProfileRepository.save(patientProfile);
        console.log(`Created patient profile for: ${patientUser.username}`);
      } else {
        console.log(`Patient user already exists: ${patientUser.username}`);
      }

      createdPatients.push(patientUser);
    }

    // Create availabilities for today and next few days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Créer plus de créneaux pour les 15 patients
    const availabilitySlots = [
      // Aujourd'hui
      { date: 0, startTime: '09:00', endTime: '10:00' },
      { date: 0, startTime: '10:00', endTime: '11:00' },
      { date: 0, startTime: '11:00', endTime: '12:00' },
      { date: 0, startTime: '14:00', endTime: '15:00' },
      { date: 0, startTime: '15:00', endTime: '16:00' },
      { date: 0, startTime: '16:00', endTime: '17:00' },
      // Demain
      { date: 1, startTime: '09:00', endTime: '10:00' },
      { date: 1, startTime: '10:00', endTime: '11:00' },
      { date: 1, startTime: '11:00', endTime: '12:00' },
      { date: 1, startTime: '14:00', endTime: '15:00' },
      { date: 1, startTime: '15:00', endTime: '16:00' },
      // Après-demain
      { date: 2, startTime: '09:00', endTime: '10:00' },
      { date: 2, startTime: '10:00', endTime: '11:00' },
      { date: 2, startTime: '14:00', endTime: '15:00' },
      { date: 2, startTime: '15:00', endTime: '16:00' },
      // Jours suivants
      { date: 3, startTime: '09:00', endTime: '10:00' },
      { date: 3, startTime: '10:00', endTime: '11:00' },
      { date: 4, startTime: '09:00', endTime: '10:00' },
      { date: 4, startTime: '14:00', endTime: '15:00' },
    ];

    const createdAvailabilities: AvailabilityEntity[] = [];

    for (const slot of availabilitySlots) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + slot.date);

      // Check if availability already exists
      const existingAvailability = await availabilityRepository.findOne({
        where: {
          doctorId: doctorProfile.id,
          date: slotDate,
          startTime: slot.startTime,
        },
      });

      if (!existingAvailability) {
        const availability = availabilityRepository.create({
          doctor: doctorProfile,
          doctorId: doctorProfile.id,
          date: slotDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: 5,
          bookedSlots: 0,
        });

        const savedAvailability = await availabilityRepository.save(availability);
        createdAvailabilities.push(savedAvailability);
        console.log(`Created availability: ${slotDate.toDateString()} ${slot.startTime}-${slot.endTime}`);
      } else {
        createdAvailabilities.push(existingAvailability);
        console.log(`Availability already exists: ${slotDate.toDateString()} ${slot.startTime}-${slot.endTime}`);
      }
    }

    // Create appointments
    const appointmentsToCreate = Math.min(createdPatients.length, createdAvailabilities.length);
    
    for (let i = 0; i < appointmentsToCreate; i++) {
      const patient = createdPatients[i];
      const availability = createdAvailabilities[i];

      // Check if appointment already exists
      const existingAppointment = await appointmentRepository.findOne({
        where: {
          patientId: patient.id,
          availabilityId: availability.id,
        },
      });

      if (!existingAppointment) {
        const appointmentDate = new Date(availability.date);
        appointmentDate.setUTCHours(0, 0, 0, 0);
        appointmentDate.setHours(12, 0, 0, 0);

        const appointment = appointmentRepository.create({
          appointmentDate,
          startTime: availability.startTime,
          endTime: availability.endTime,
          status: AppointmentStatus.RESERVED,
          patientId: patient.id,
          availabilityId: availability.id,
        });

        await appointmentRepository.save(appointment);

        // Update availability booked slots
        availability.bookedSlots = (availability.bookedSlots || 0) + 1;
        await availabilityRepository.save(availability);

        console.log(`Created appointment for patient ${patient.username} on ${appointmentDate.toDateString()}`);
      } else {
        console.log(`Appointment already exists for patient ${patient.username}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`Created/Found ${createdPatients.length} patients`);
    console.log(`Created/Found ${createdAvailabilities.length} availabilities`);
    console.log(`Created appointments for the doctor`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed
seed();

