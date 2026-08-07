import { Router } from 'express';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { gzip } from 'zlib';
import { promisify } from 'util';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { readingsInRange } from '../services/readingService.js';
import { getSensorByIdAndUser } from '../services/sensorService.js';
import config from '../config.js';
import { db } from '../db-postgres.js';

const router = Router();
const gzipAsync = promisify(gzip);

const metricCatalog = {
  do_concentration: { label: 'DO Concentration (mg/L)', field: 'do_concentration' },
  corrected_do: { label: 'Corrected DO (mg/L)', field: 'corrected_do' },
  temperature: { label: 'Temperature (°C)', field: 'temperature' },
  pressure: { label: 'Pressure (kPa)', field: 'pressure' },
  do_saturation: { label: 'DO Saturation (%)', field: 'do_saturation' },
};

const filterMetrics = (requested) => {
  if (!requested?.length) {
    return ['do_concentration', 'corrected_do', 'temperature', 'pressure', 'do_saturation'];
  }
  return requested.filter((key) => metricCatalog[key]);
};

const parseDateToEpoch = (value, fallbackSeconds) => {
  if (!value) return fallbackSeconds;
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return Math.floor(numeric > 1e12 ? numeric / 1000 : numeric);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fallbackSeconds;
  return Math.floor(parsed / 1000);
};

const buildDataset = (rows, metrics) =>
  rows.map((row) => {
    const record = {
      'Timestamp (epoch)': row.captured_at,
      'Timestamp (ISO)': new Date(row.captured_at * 1000).toISOString(),
    };
    
    // Map metrics to user-friendly column names
    metrics.forEach((metric) => {
      const metricInfo = metricCatalog[metric];
      const value = row[metricInfo.field];
      
      // Use clean labels as column headers
      if (metric === 'do_concentration') {
        record['DO Concentration (mg/L)'] = value != null ? Number(value).toFixed(3) : '';
      } else if (metric === 'corrected_do') {
        record['Corrected DO (mg/L)'] = value != null ? Number(value).toFixed(3) : '';
      } else if (metric === 'temperature') {
        record['Temperature (°C)'] = value != null ? Number(value).toFixed(2) : '';
      } else if (metric === 'pressure') {
        record['Pressure (kPa)'] = value != null ? Number(value).toFixed(2) : '';
      } else if (metric === 'do_saturation') {
        record['DO Saturation (%)'] = value != null ? Number(value).toFixed(2) : '';
      }
    });
    return record;
  });

const buildAnalytics = (dataset, metrics) => {
  const summary = metrics.map((metric) => {
    const values = dataset
      .map((row) => Number(row[metric]))
      .filter((v) => Number.isFinite(v));
    if (!values.length) return null;
    const total = values.reduce((sum, v) => sum + v, 0);
    return {
      metric,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Number((total / values.length).toFixed(3)),
      count: values.length,
    };
  }).filter(Boolean);

  return { metrics: summary };
};

const compressIfNeeded = async (buffer, fileName, shouldCompress, mimeType) => {
  if (!shouldCompress) {
    return { payload: buffer, downloadName: fileName, contentType: mimeType };
  }
  const compressed = await gzipAsync(buffer);
  return { payload: compressed, downloadName: `${fileName}.gz`, contentType: 'application/gzip' };
};

const buildXlsxBuffer = async ({ dataset, analytics, metrics, includeRaw }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DO Sensor Dashboard';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Data');
  
  // Build columns with clean headers matching the dataset keys
  const dataColumns = [
    { header: 'Timestamp (epoch)', key: 'Timestamp (epoch)', width: 18 },
    { header: 'Timestamp (ISO)', key: 'Timestamp (ISO)', width: 28 },
  ];
  
  // Add metric columns with proper labels
  metrics.forEach((metric) => {
    if (metric === 'do_concentration') {
      dataColumns.push({ header: 'DO Concentration (mg/L)', key: 'DO Concentration (mg/L)', width: 22 });
    } else if (metric === 'corrected_do') {
      dataColumns.push({ header: 'Corrected DO (mg/L)', key: 'Corrected DO (mg/L)', width: 22 });
    } else if (metric === 'temperature') {
      dataColumns.push({ header: 'Temperature (°C)', key: 'Temperature (°C)', width: 18 });
    } else if (metric === 'pressure') {
      dataColumns.push({ header: 'Pressure (kPa)', key: 'Pressure (kPa)', width: 18 });
    } else if (metric === 'do_saturation') {
      dataColumns.push({ header: 'DO Saturation (%)', key: 'DO Saturation (%)', width: 18 });
    }
  });
  
  dataSheet.columns = dataColumns;

  if (includeRaw && dataset.length) {
    dataSheet.addRows(dataset);
  } else {
    dataSheet.addRow({ 'Timestamp (ISO)': 'Raw data excluded from export' });
  }

  if (analytics?.metrics?.length) {
    const analyticsSheet = workbook.addWorksheet('Analytics');
    analyticsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 24 },
      { header: 'Average', key: 'avg', width: 12 },
      { header: 'Minimum', key: 'min', width: 12 },
      { header: 'Maximum', key: 'max', width: 12 },
      { header: 'Samples', key: 'count', width: 12 },
    ];
    analyticsSheet.addRows(analytics.metrics);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const buildPdfBuffer = async ({ dataset, analytics, metrics, includeRaw, meta }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('error', reject);
  doc.on('end', () => resolve(Buffer.concat(chunks)));

  doc.fontSize(16).text('DO Sensor Data Export', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Sensor: ${meta.sensorId}`);
  doc.text(`Date range: ${meta.from} → ${meta.to}`);
  doc.text(`Metrics: ${metrics.join(', ')}`);
  doc.text(`Records: ${dataset.length}`);

  if (analytics?.metrics?.length) {
    doc.moveDown();
    doc.fontSize(12).text('Analytics', { underline: true });
    doc.moveDown(0.5);
    analytics.metrics.forEach((item) => {
      doc.fontSize(10).text(`${item.metric}: avg ${item.avg} | min ${item.min} | max ${item.max} | n=${item.count}`);
    });
  }

  if (includeRaw && dataset.length) {
    doc.moveDown();
    doc.fontSize(12).text('Data (first 200 rows)', { underline: true });
    doc.moveDown(0.5);
    const preview = dataset.slice(0, 200);
    doc.fontSize(7);
    
    // Use clean headers from dataset keys
    const headers = Object.keys(preview[0]);
    doc.text(headers.join(' | '));
    doc.moveDown(0.2);
    
    preview.forEach((row) => {
      const line = headers.map((key) => row[key] ?? '').join(' | ');
      doc.text(line);
    });
    
    if (dataset.length > 200) {
      doc.moveDown(0.5);
      doc.text(`(+${dataset.length - 200} more rows)`);
    }
  }

  doc.end();
});

router.get('/readings', requireAuth, asyncHandler(async (req, res) => {
  // Resolve user's sensor if sensor_id not provided
  let sensorId = req.query.sensor_id;
  if (!sensorId) {
    const userSensor = await db.get('SELECT id FROM sensors WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1', [req.user.id]);
    sensorId = userSensor?.id || config.deviceDefaultId;
  }
  
  const sensor = await getSensorByIdAndUser(sensorId, req.user.id);
  if (!sensor) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const defaultFrom = nowSeconds - (7 * 24 * 60 * 60);
  const fromTime = parseDateToEpoch(req.query.start, defaultFrom);
  const toTime = parseDateToEpoch(req.query.end, nowSeconds);
  const validFrom = Math.min(fromTime, toTime);
  const validTo = Math.max(fromTime, toTime);

  const metrics = filterMetrics(req.query.metrics?.split(','));
  const includeRaw = req.query.includeRaw !== 'false';
  const includeAnalytics = req.query.includeAnalytics === 'true' || req.query.includeAnalytics === '1';
  const compression = req.query.compression === 'true' || req.query.compression === '1';
  const format = (req.query.format || 'csv').toString().toLowerCase();

  const rows = await readingsInRange(sensorId, validFrom, validTo);
  const dataset = buildDataset(rows, metrics);
  const analytics = includeAnalytics ? buildAnalytics(dataset, metrics) : null;

  const dateSuffix = `${new Date(validFrom * 1000).toISOString().slice(0, 10)}_${new Date(validTo * 1000).toISOString().slice(0, 10)}`;
  const baseName = `do-sensor-data_${dateSuffix}.${format}`;
  const meta = {
    sensorId,
    from: new Date(validFrom * 1000).toISOString(),
    to: new Date(validTo * 1000).toISOString(),
  };

  let finalBuffer;
  let finalMimeType;
  let finalExtension = format;

  if (format === 'json') {
    const payload = JSON.stringify({ meta, metrics, data: includeRaw ? dataset : [], analytics });
    finalBuffer = Buffer.from(payload);
    finalMimeType = 'application/json';
    const { payload: finalPayload, downloadName, contentType } = await compressIfNeeded(finalBuffer, baseName, compression, finalMimeType);
    
    // Log export to database
    await db.run(
      `INSERT INTO export_logs (user_id, filename, file_size, format, start_date, end_date, metrics, include_analytics, include_charts, include_raw, compression, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [req.user.id, downloadName, finalPayload.length, format, validFrom, validTo, JSON.stringify(metrics), includeAnalytics, false, includeRaw, compression, Math.floor(Date.now() / 1000)]
    );
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.send(finalPayload);
  }

  if (format === 'xlsx' || format === 'excel') {
    const buffer = await buildXlsxBuffer({ dataset, analytics, metrics, includeRaw });
    finalBuffer = buffer;
    finalMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const { payload: finalPayload, downloadName, contentType } = await compressIfNeeded(buffer, baseName, compression, finalMimeType);
    
    // Log export to database
    await db.run(
      `INSERT INTO export_logs (user_id, filename, file_size, format, start_date, end_date, metrics, include_analytics, include_charts, include_raw, compression, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [req.user.id, downloadName.replace('.excel', '.xlsx'), finalPayload.length, 'xlsx', validFrom, validTo, JSON.stringify(metrics), includeAnalytics, false, includeRaw, compression, Math.floor(Date.now() / 1000)]
    );
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName.replace('.excel', '.xlsx')}"`);
    return res.send(finalPayload);
  }

  if (format === 'pdf') {
    const buffer = await buildPdfBuffer({ dataset, analytics, metrics, includeRaw, meta });
    finalBuffer = buffer;
    finalMimeType = 'application/pdf';
    const { payload: finalPayload, downloadName, contentType } = await compressIfNeeded(buffer, baseName, compression, finalMimeType);
    
    // Log export to database
    await db.run(
      `INSERT INTO export_logs (user_id, filename, file_size, format, start_date, end_date, metrics, include_analytics, include_charts, include_raw, compression, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [req.user.id, downloadName, finalPayload.length, format, validFrom, validTo, JSON.stringify(metrics), includeAnalytics, false, includeRaw, compression, Math.floor(Date.now() / 1000)]
    );
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.send(finalPayload);
  }

  // Default CSV
  const csvRows = [];
  if (includeRaw && dataset.length) {
    csvRows.push(...dataset);
  }

  if (analytics?.metrics?.length) {
    csvRows.push({});
    csvRows.push({ metric: 'metric', avg: 'average', min: 'min', max: 'max', count: 'count' });
    analytics.metrics.forEach((item) => csvRows.push(item));
  }

  if (!csvRows.length) {
    csvRows.push({ notice: 'No data available for the selected range' });
  }

  const csv = stringify(csvRows, { header: true });
  finalBuffer = Buffer.from(csv);
  finalMimeType = 'text/csv';
  const { payload: finalPayload, downloadName, contentType } = await compressIfNeeded(finalBuffer, baseName.replace('.csv', '.csv'), compression, finalMimeType);
  
  // Log export to database
  await db.run(
    `INSERT INTO export_logs (user_id, filename, file_size, format, start_date, end_date, metrics, include_analytics, include_charts, include_raw, compression, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [req.user.id, downloadName, finalPayload.length, 'csv', validFrom, validTo, JSON.stringify(metrics), includeAnalytics, false, includeRaw, compression, Math.floor(Date.now() / 1000)]
  );
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  return res.send(finalPayload);
}));

router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  // Aggregate stats across all sensors owned by the user so the dashboard reflects their data
  const sensors = await db.all('SELECT id FROM sensors WHERE user_id = $1', [req.user.id]);
  if (!sensors?.length) {
    return res.json({
      total_records: 0,
      total_size_bytes: 0,
      oldest_record: null,
      newest_record: null,
      average_records_per_day: 0,
      data_points: [],
      retention_days: 30,
      last_updated: new Date().toISOString(),
    });
  }

  const sensorIds = sensors.map((s) => s.id);
  const placeholders = sensorIds.map((_, i) => `$${i + 1}`).join(',');
  const baseParams = [...sensorIds];

  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromTime = parseDateToEpoch(req.query.start, nowSeconds - (30 * 24 * 60 * 60));
  const toTime = parseDateToEpoch(req.query.end, nowSeconds);
  const validFrom = Math.min(fromTime, toTime);
  const validTo = Math.max(fromTime, toTime);
  const paramsWithRange = [...baseParams, validFrom, validTo];
  const rangeClause = ' AND captured_at BETWEEN $' + (baseParams.length + 1) + ' AND $' + (baseParams.length + 2);

  const stats = await db.get(
    `SELECT COUNT(*)::int as total_records, MIN(captured_at) as oldest_record, MAX(captured_at) as newest_record
     FROM readings WHERE sensor_id IN (${placeholders})${rangeClause}`,
    paramsWithRange
  ) || { total_records: 0, oldest_record: null, newest_record: null };

  const metrics = filterMetrics();
  const dataPoints = await Promise.all(metrics.map(async (metric) => {
    const row = await db.get(
      `SELECT COUNT(${metric})::int as count FROM readings WHERE sensor_id IN (${placeholders})${rangeClause}`,
      paramsWithRange
    );
    return { parameter: metric, count: row?.count || 0 };
  }));

  const totalRecords = stats.total_records || 0;
  const oldestIso = stats.oldest_record ? new Date(stats.oldest_record * 1000).toISOString() : null;
  const newestIso = stats.newest_record ? new Date(stats.newest_record * 1000).toISOString() : null;
  const spanDays = oldestIso && newestIso ? Math.max(1, (stats.newest_record - stats.oldest_record) / 86400) : 1;
  const averagePerDay = totalRecords ? Number((totalRecords / spanDays).toFixed(2)) : 0;

  // Roughly estimate row size for UI storage indicator (1KB per reading)
  const estimatedBytes = totalRecords * 1024;

  return res.json({
    total_records: totalRecords,
    total_size_bytes: estimatedBytes,
    oldest_record: oldestIso,
    newest_record: newestIso,
    average_records_per_day: averagePerDay,
    retention_days: 30,
    data_points: dataPoints,
    last_updated: new Date().toISOString(),
  });
}));

router.get('/logs', requireAuth, asyncHandler(async (req, res) => {
  const logs = await db.all(
    `SELECT id, filename, file_size, format, start_date, end_date, metrics, 
            include_analytics, include_charts, include_raw, compression, created_at
     FROM export_logs 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [req.user.id]
  );
  
  return res.json(logs);
}));

export default router;
