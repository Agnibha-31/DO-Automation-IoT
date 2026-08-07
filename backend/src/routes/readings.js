import { Router } from 'express';
import { z } from 'zod';
import config from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDeviceKey, requireAuth } from '../middleware/auth.js';
import { ingestReading, latestReading, readingsInRange, getReadingStats } from '../services/readingService.js';
import { getSensorByIdAndUser } from '../services/sensorService.js';
import { db } from '../db-postgres.js';

const router = Router();

const ingestSchema = z.object({
  do_concentration: z.number().optional(),
  corrected_do: z.number().optional(),
  temperature: z.number().optional(),
  pressure: z.number().optional(),
  do_saturation: z.number().optional(),
  timestamp: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/', requireDeviceKey, asyncHandler(async (req, res) => {
  const payload = ingestSchema.parse(req.body ?? {});
  const reading = await ingestReading({ sensorId: req.sensor.id, payload });
  res.status(201).json({ reading });
}));

// Helper: pick the user's sensor if sensor_id not provided
const resolveUserSensorId = async (req) => {
  if (req.query.sensor_id) return req.query.sensor_id;
  const row = await db.get('SELECT id FROM sensors WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1', [req.user.id]);
  return row?.id || config.deviceDefaultId;
};

router.get('/latest', requireAuth, asyncHandler(async (req, res) => {
  const sensorId = await resolveUserSensorId(req);
  const sensor = await getSensorByIdAndUser(sensorId, req.user.id);
  if (!sensor) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const reading = await latestReading(sensorId);
  res.json({ reading });
}));

router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  const sensorId = await resolveUserSensorId(req);
  const sensor = await getSensorByIdAndUser(sensorId, req.user.id);
  if (!sensor) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const limit = parseInt(req.query.limit) || 500;
  const fromTime = Math.floor(Date.now() / 1000) - (limit * 60);
  const rows = await readingsInRange(sensorId, fromTime, Math.floor(Date.now() / 1000));
  
  res.json({
    sensor_id: sensorId,
    points: rows.slice(-limit),
    count: rows.length,
  });
}));

router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const sensorId = await resolveUserSensorId(req);
  const sensor = await getSensorByIdAndUser(sensorId, req.user.id);
  if (!sensor) {
    return res.json({
      sensor_id: sensorId,
      total_readings: 0,
      earliest_timestamp: null,
      latest_timestamp: null,
    });
  }
  
  const stats = await getReadingStats(sensorId);
  res.json({
    sensor_id: sensorId,
    ...stats,
  });
}));

router.get('/storage-info', requireAuth, asyncHandler(async (req, res) => {
  // Get all sensors for this user
  const sensors = await db.all('SELECT id FROM sensors WHERE user_id = $1', [req.user.id]);
  
  if (!sensors || sensors.length === 0) {
    return res.json({
      totalReadings: 0,
      estimatedSizeGB: 0
    });
  }
  
  // Count total readings across all user's sensors
  const sensorIds = sensors.map(s => s.id);
  const placeholders = sensorIds.map((_, i) => `$${i + 1}`).join(',');
  const result = await db.get(
    `SELECT COUNT(*) as count FROM readings WHERE sensor_id IN (${placeholders})`,
    sensorIds
  );
  
  const totalReadings = result?.count || 0;
  // Estimate: ~1KB per reading
  const estimatedSizeGB = (totalReadings * 1024) / (1024 * 1024 * 1024);
  
  res.json({
    totalReadings,
    estimatedSizeGB
  });
}));

export default router;
