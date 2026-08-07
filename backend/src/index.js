import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config.js';
import { db } from './db-postgres.js';
import authRoutes from './routes/auth.js';
import readingsRoutes from './routes/readings.js';
import sensorsRoutes from './routes/sensors.js';
import exportRoutes from './routes/export.js';
import calibrateRoutes from './routes/calibrate.js';
import dacRoutes from './routes/dac.js';

const app = express();

app.use(cors({
  origin: config.corsOrigin === '*' ? '*' : config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/calibrate', calibrateRoutes);
app.use('/api/dac', dacRoutes);

app.use((err, req, res, next) => {
  console.error('[API_ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const bootstrap = async () => {
  await db.init();

  const userCount = await db.get('SELECT COUNT(*) as total FROM users');
  if (userCount && userCount.total > 0) {
    console.log(`✅ Multi-user system ready with ${userCount.total} user(s)`);
  } else {
    console.log('✅ No users found - waiting for first user registration');
  }

  const server = app.listen(config.port, () => {
    console.log(`✅ DO Sensor backend ready on http://localhost:${config.port}`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received: Closing server...`);
    
    server.close(async () => {
      console.log('✅ Server closed');
      
      try {
        await db.close();
        console.log('✅ Database connections closed');
      } catch (err) {
        console.error('Error closing database:', err);
      }
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });
    
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
  
  if (process.platform === 'win32') {
    const readline = await import('readline');
    readline.createInterface({ input: process.stdin }).on('SIGINT', () => {
      gracefulShutdown('SIGINT');
    });
  }
};

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
