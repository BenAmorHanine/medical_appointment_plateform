//import { registerAs } from '@nestjs/config';

export const databaseConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medical_appointment',
});

//This file defines database configuration settings using environment variables with default values.
