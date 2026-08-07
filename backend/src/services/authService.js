import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../config.js';
import { db } from '../db-postgres.js';

const SALT_ROUNDS = 10;

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

export const issueToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );

export const verifyPassword = async (plaintext, hash) => bcrypt.compare(plaintext, hash);

export const hashPassword = async (plaintext) => bcrypt.hash(plaintext, SALT_ROUNDS);

export const findUserByEmail = async (email) =>
  db.get('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);

export const findUserById = async (id) =>
  db.get('SELECT * FROM users WHERE id = $1', [id]);

export const countUsers = async () => {
  const row = await db.get('SELECT COUNT(*) as total FROM users');
  return row?.total ?? 0;
};

export const setResetToken = async (userId, token, expiresAt) => {
  await db.run(
    'UPDATE users SET reset_token = $1, reset_expires = $2, updated_at = $3 WHERE id = $4',
    [token, expiresAt, Math.floor(Date.now() / 1000), userId]
  );
};

export const clearResetToken = async (userId) => {
  await db.run(
    'UPDATE users SET reset_token = NULL, reset_expires = NULL, updated_at = $1 WHERE id = $2',
    [Math.floor(Date.now() / 1000), userId]
  );
};

export const createUser = async ({ email, password, name, role = 'operator', timezone = 'UTC', language = 'en', country = 'US' }) => {
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  
  await db.run(
    `INSERT INTO users (id, email, name, password_hash, role, timezone, language, country, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [userId, email, name, passwordHash, role, timezone, language, country, now, now]
  );

  const { createDefaultSensor } = await import('./sensorService.js');
  await createDefaultSensor(userId);

  return db.get('SELECT * FROM users WHERE id = $1', [userId]);
};

export const setNewPasswordWithToken = async ({ email, token, newPassword }) => {
  const now = Math.floor(Date.now() / 1000);
  const user = await findUserByEmail(email);
  if (!user || !user.reset_token || !user.reset_expires) return null;
  if (user.reset_token !== token) return null;
  if (user.reset_expires < now) return null;

  const passwordHash = await hashPassword(newPassword);
  await db.run(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = $2 WHERE id = $3',
    [passwordHash, now, user.id]
  );
  return db.get('SELECT * FROM users WHERE id = $1', [user.id]);
};

export const updateUserProfile = async (userId, updates) => {
  const now = Math.floor(Date.now() / 1000);
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.timezone !== undefined) {
    fields.push(`timezone = $${paramIndex++}`);
    values.push(updates.timezone);
  }
  if (updates.language !== undefined) {
    fields.push(`language = $${paramIndex++}`);
    values.push(updates.language);
  }
  if (updates.country !== undefined) {
    fields.push(`country = $${paramIndex++}`);
    values.push(updates.country);
  }

  if (fields.length === 0) return db.get('SELECT * FROM users WHERE id = $1', [userId]);

  fields.push(`updated_at = $${paramIndex++}`);
  values.push(now);
  values.push(userId);

  await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
  return db.get('SELECT * FROM users WHERE id = $1', [userId]);
};

export const changePassword = async (userId, newPassword) => {
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await hashPassword(newPassword);
  await db.run(
    'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
    [passwordHash, now, userId]
  );
  return db.get('SELECT * FROM users WHERE id = $1', [userId]);
};
