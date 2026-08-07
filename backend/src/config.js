import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.BACKEND_PORT || process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://do-sensor-dashboard.vercel.app' : '*'),
  jwtSecret: process.env.JWT_SECRET || 'do-sensor-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '12h',
  databaseUrl: process.env.DATABASE_URL,
  deviceDefaultId: process.env.DEVICE_ID || 'sensor-001',
  deviceApiKey: process.env.DEVICE_API_KEY || 'CHANGE_ME_DEVICE_KEY',
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://do-sensor-backend.onrender.com' : `http://localhost:${process.env.PORT || 5000}`),
};

export default config;
