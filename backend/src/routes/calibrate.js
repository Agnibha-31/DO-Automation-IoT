import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDeviceKey } from '../middleware/auth.js';
import { db } from '../db-postgres.js';

const router = Router();

const calibrateSchema = z.object({
  mode: z.enum(['zero', 'span']),
  value: z.number().optional(),
});

router.post('/', requireDeviceKey, asyncHandler(async (req, res) => {
  const { mode, value } = calibrateSchema.parse(req.body);
  const timestamp = Math.floor(Date.now() / 1000);

  await db.run(
    `INSERT INTO calibration_events (sensor_id, mode, value, timestamp, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.sensor.id, mode, value || null, timestamp, timestamp]
  );

  res.json({
    success: true,
    mode,
    timestamp,
    message: `${mode} calibration completed`,
  });
}));

export default router;
