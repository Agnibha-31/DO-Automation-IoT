import { randomUUID } from 'crypto';
import { db } from '../db-postgres.js';

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const createDefaultSensor = async (userId) => {
  const id = `sensor-${randomUUID()}`;
  const apiKey = randomUUID();
  const timestamp = nowSeconds();
  
  await db.run(
    `INSERT INTO sensors (id, user_id, name, api_key, sensor_type, location, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, 'Primary DO Sensor', apiKey, 'RS-LDO-N01', 'Default Location', timestamp, timestamp]
  );
  
  return db.get('SELECT * FROM sensors WHERE id = $1', [id]);
};

export const listSensors = async (userId) => {
  return db.all('SELECT * FROM sensors WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
};

export const getSensorById = async (id) =>
  db.get('SELECT * FROM sensors WHERE id = $1', [id]);

export const getSensorByIdAndUser = async (sensorId, userId) => {
  return db.get('SELECT * FROM sensors WHERE id = $1 AND user_id = $2', [sensorId, userId]);
};

export const updateSensorLastSeen = async (sensorId, timestamp = nowSeconds()) => {
  await db.run(
    'UPDATE sensors SET last_seen = $1, updated_at = $2 WHERE id = $3',
    [timestamp, timestamp, sensorId]
  );
};

export const regenerateSensorApiKey = async (sensorId) => {
  const oldSensor = await db.get('SELECT * FROM sensors WHERE id = $1', [sensorId]);
  console.log('🔄 [REGENERATE] Starting API key regeneration for sensor:', sensorId);
  console.log('🔑 [REGENERATE] OLD API Key:', oldSensor?.api_key);
  
  const newApiKey = randomUUID();
  console.log('🆕 [REGENERATE] NEW API Key generated:', newApiKey);
  
  const timestamp = nowSeconds();
  await db.run(
    'UPDATE sensors SET api_key = $1, updated_at = $2 WHERE id = $3',
    [newApiKey, timestamp, sensorId]
  );

  const updatedSensor = await db.get('SELECT * FROM sensors WHERE id = $1', [sensorId]);
  console.log('✅ [REGENERATE] Fetched updated sensor, api_key:', updatedSensor?.api_key);
  console.log('🔍 [REGENERATE] Verification - Keys different:', oldSensor?.api_key !== updatedSensor?.api_key);
  
  return updatedSensor;
};
