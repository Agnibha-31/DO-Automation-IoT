import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDeviceKey } from '../middleware/auth.js';
import { db } from '../db-postgres.js';

const router = Router();

const dacSchema = z.object({
  corrected_do: z.number().nullable().optional(),
});

router.post('/', requireDeviceKey, asyncHandler(async (req, res) => {
  const { corrected_do } = dacSchema.parse(req.body);
  const timestamp = Math.floor(Date.now() / 1000);

  const existing = await db.get('SELECT * FROM dac_settings WHERE sensor_id = $1', [req.sensor.id]);
  
  if (existing) {
    await db.run(
      'UPDATE dac_settings SET corrected_do = $1, updated_at = $2 WHERE sensor_id = $3',
      [corrected_do, timestamp, req.sensor.id]
    );
  } else {
    await db.run(
      `INSERT INTO dac_settings (sensor_id, corrected_do, updated_at)
       VALUES ($1, $2, $3)`,
      [req.sensor.id, corrected_do, timestamp]
    );
  }

  res.json({
    success: true,
    corrected_do,
    timestamp,
    message: 'DAC setting updated',
  });
}));

export default router;
