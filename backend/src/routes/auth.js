import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { issueToken, sanitizeUser, findUserByEmail, createUser, verifyPassword, updateUserProfile, changePassword, countUsers, setResetToken, clearResetToken, setNewPasswordWithToken } from '../services/authService.js';
import { randomUUID } from 'crypto';
import { db } from '../db-postgres.js';

const router = Router();

router.get('/check-first-user', asyncHandler(async (req, res) => {
  const userCount = await countUsers();
  res.json({ isFirstUser: userCount === 0 });
}));

router.post('/check-email', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  const existing = await findUserByEmail(email.trim());
  res.json({ exists: !!existing });
}));

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

router.post('/register', asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    return res.status(409).json({ error: 'User already registered. Please login using your credentials.' });
  }
  const user = await createUser(payload);
  const token = issueToken(user);
  res.status(201).json({ token, user: sanitizeUser(user) });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not registered. Please create an account first.' });
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = issueToken(user);
  res.json({ token, user: sanitizeUser(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

const preferenceSchema = z.object({
  name: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
});

router.patch('/preferences', requireAuth, asyncHandler(async (req, res) => {
  const payload = preferenceSchema.parse(req.body);
  const updated = await updateUserProfile(req.user.id, payload);
  res.json({ user: sanitizeUser(updated) });
}));

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  const user = await db.get('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  await changePassword(req.user.id, newPassword);
  res.json({ success: true });
}));

const forgotSchema = z.object({
  email: z.string().email(),
});

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = forgotSchema.parse(req.body);
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not registered. Please create an account first.' });
  }
  const token = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes
  await setResetToken(user.id, token, expiresAt);
  res.json({ message: 'Password reset token generated. Use it within 15 minutes.', reset_token: token });
}));

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, token, newPassword } = resetSchema.parse(req.body);
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not registered. Please create an account first.' });
  }
  const updated = await setNewPasswordWithToken({ email, token, newPassword });
  if (!updated) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  await clearResetToken(user.id);
  res.json({ message: 'Password reset successful. You can now login with your new password.' });
}));

router.get('/device-config', requireAuth, asyncHandler(async (req, res) => {
  const user = await db.get('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get or create sensor for this user
  let sensor = await db.get('SELECT id, api_key FROM sensors WHERE user_id = $1', [user.id]);
  
  if (!sensor) {
    // Create a sensor with unique API key if doesn't exist
    const sensorId = `sensor_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const apiKey = `sk_${randomUUID().replace(/-/g, '')}`;
    const now = Date.now();
    
    await db.run(
      'INSERT INTO sensors (id, user_id, name, api_key, sensor_type, location, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [sensorId, user.id, 'Primary Sensor', apiKey, 'RS-LDO-N01', 'Unknown', now, now]
    );
    
    sensor = { id: sensorId, api_key: apiKey };
  }

  res.json({
    deviceId: sensor.id,
    apiKey: sensor.api_key,
    userId: user.id,
    userEmail: user.email,
    createdAt: new Date(Number(user.created_at)).toISOString()
  });
}));

router.delete('/delete-account', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Start transaction to delete all related data
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all readings for user's sensors
    await client.query(
      'DELETE FROM readings WHERE sensor_id IN (SELECT id FROM sensors WHERE user_id = $1)',
      [userId]
    );
    
    // Delete all calibration events for user's sensors
    await client.query(
      'DELETE FROM calibration_events WHERE sensor_id IN (SELECT id FROM sensors WHERE user_id = $1)',
      [userId]
    );
    
    // Delete all DAC settings for user's sensors
    await client.query(
      'DELETE FROM dac_settings WHERE sensor_id IN (SELECT id FROM sensors WHERE user_id = $1)',
      [userId]
    );
    
    // Delete all export logs for the user
    await client.query('DELETE FROM export_logs WHERE user_id = $1', [userId]);
    
    // Delete all sensors belonging to user
    await client.query('DELETE FROM sensors WHERE user_id = $1', [userId]);
    
    // Finally delete the user account
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Account deleted successfully: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Account and all associated data have been permanently deleted' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting account:', error);
    throw error;
  } finally {
    client.release();
  }
}));

export default router;
