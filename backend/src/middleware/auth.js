import jwt from 'jsonwebtoken';
import config from '../config.js';
import { db } from '../db-postgres.js';

const bearerFromHeader = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = bearerFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await db.get('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone,
      language: user.language,
      country: user.country,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
};

export const requireDeviceKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const sensor = await db.get('SELECT * FROM sensors WHERE api_key = $1', [apiKey]);
    if (!sensor) {
      return res.status(403).json({ error: 'Invalid device key' });
    }

    req.sensor = sensor;
    next();
  } catch (err) {
    next(err);
  }
};
