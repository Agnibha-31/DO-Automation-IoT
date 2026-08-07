import { db } from '../db-postgres.js';
import { updateSensorLastSeen } from './sensorService.js';

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const ingestReading = async ({ sensorId, payload }) => {
  const capturedAt = payload.timestamp ? Math.floor(Number(payload.timestamp)) : nowSeconds();
  const metadata = payload.metadata ? JSON.stringify(payload.metadata) : null;

  await db.run(
    `INSERT INTO readings (sensor_id, captured_at, do_concentration, corrected_do, temperature, pressure, do_saturation, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      sensorId,
      capturedAt,
      payload.do_concentration ?? null,
      payload.corrected_do ?? null,
      payload.temperature ?? null,
      payload.pressure ?? null,
      payload.do_saturation ?? null,
      metadata,
      nowSeconds(),
    ]
  );

  await updateSensorLastSeen(sensorId, capturedAt);

  return db.get(
    'SELECT * FROM readings WHERE sensor_id = $1 ORDER BY id DESC LIMIT 1',
    [sensorId]
  );
};

export const latestReading = async (sensorId) =>
  db.get(
    'SELECT * FROM readings WHERE sensor_id = $1 ORDER BY captured_at DESC, id DESC LIMIT 1',
    [sensorId]
  );

export const readingsInRange = async (sensorId, fromEpoch, toEpoch) =>
  db.all(
    `SELECT * FROM readings WHERE sensor_id = $1 AND captured_at BETWEEN $2 AND $3 ORDER BY captured_at ASC`,
    [sensorId, fromEpoch, toEpoch]
  );

export const deleteReadingsBefore = async (sensorId, beforeEpoch) =>
  db.run(
    'DELETE FROM readings WHERE sensor_id = $1 AND captured_at <= $2',
    [sensorId, beforeEpoch]
  );

export const getReadingStats = async (sensorId) => {
  const stats = await db.get(
    `SELECT COUNT(*) as total_readings, MIN(captured_at) as earliest_timestamp, MAX(captured_at) as latest_timestamp FROM readings WHERE sensor_id = $1`,
    [sensorId]
  );
  return stats || { total_readings: 0, earliest_timestamp: null, latest_timestamp: null };
};
