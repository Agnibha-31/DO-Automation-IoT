import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { listSensors, regenerateSensorApiKey, getSensorByIdAndUser } from '../services/sensorService.js';
import config from '../config.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const sensors = await listSensors(req.user.id);
  res.json({ sensors });
}));

router.post('/:sensorId/regenerate-key', requireAuth, asyncHandler(async (req, res) => {
  console.log('📡 [API] Regenerate API key request for sensor:', req.params.sensorId);
  const sensor = await getSensorByIdAndUser(req.params.sensorId, req.user.id);
  if (!sensor) {
    console.log('❌ [API] Sensor not found or access denied');
    return res.status(404).json({ error: 'Sensor not found or access denied' });
  }
  console.log('✅ [API] Sensor found, proceeding with regeneration');
  const updatedSensor = await regenerateSensorApiKey(req.params.sensorId);
  console.log('📤 [API] Sending response with api_key:', updatedSensor.api_key);
  res.json({ 
    sensor: updatedSensor,
    message: 'API key regenerated successfully. Update your sensor with the new key.' 
  });
}));

export default router;
