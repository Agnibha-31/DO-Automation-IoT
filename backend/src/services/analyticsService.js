const calculateStats = (values, decimals = 2) => {
  if (!values.length) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      stdDev: 0,
      p25: 0,
      p75: 0,
      p95: 0,
      count: 0,
    };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const percentile = (arr, p) => {
    if (arr.length === 0) return 0;
    const index = (p / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    if (lower === upper) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
  };
  
  return {
    min: parseFloat(Math.min(...values).toFixed(decimals)),
    max: parseFloat(Math.max(...values).toFixed(decimals)),
    avg: parseFloat(avg.toFixed(decimals)),
    median: parseFloat(percentile(sorted, 50).toFixed(decimals)),
    stdDev: parseFloat(stdDev.toFixed(decimals)),
    p25: parseFloat(percentile(sorted, 25).toFixed(decimals)),
    p75: parseFloat(percentile(sorted, 75).toFixed(decimals)),
    p95: parseFloat(percentile(sorted, 95).toFixed(decimals)),
    count: values.length,
  };
};

export const buildSummary = (readings) => {
  if (!readings.length) {
    return {
      do_concentration: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0, count: 0 },
      corrected_do: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0, count: 0 },
      temperature: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0, count: 0 },
      pressure: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0, count: 0 },
      do_saturation: { min: 0, max: 0, avg: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0, count: 0 },
    };
  }

  const dos = readings.map(r => parseFloat(r.do_concentration) || 0).filter(v => Number.isFinite(v) && v >= 0);
  const correctedDos = readings.map(r => parseFloat(r.corrected_do) || 0).filter(v => Number.isFinite(v) && v >= 0);
  const temps = readings.map(r => parseFloat(r.temperature) || 0).filter(v => Number.isFinite(v));
  const pressures = readings.map(r => parseFloat(r.pressure) || 0).filter(v => Number.isFinite(v) && v > 0);
  const saturations = readings.map(r => parseFloat(r.do_saturation) || 0).filter(v => Number.isFinite(v) && v >= 0);

  return {
    do_concentration: calculateStats(dos, 2),
    corrected_do: calculateStats(correctedDos, 2),
    temperature: calculateStats(temps, 1),
    pressure: calculateStats(pressures, 1),
    do_saturation: calculateStats(saturations, 1),
    reading_count: readings.length,
  };
};

export const bucketizeReadings = (readings, intervalSeconds) => {
  if (!readings.length) return [];
  const buckets = new Map();
  
  readings.forEach((reading) => {
    const bucketKey = Math.floor(reading.captured_at / intervalSeconds) * intervalSeconds;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey).push(reading);
  });

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, rows]) => {
      const dos = rows.map(r => parseFloat(r.do_concentration) || 0);
      const temps = rows.map(r => parseFloat(r.temperature) || 0);
      const pressures = rows.map(r => parseFloat(r.pressure) || 0);

      return {
        timestamp,
        do_concentration: dos.length ? (dos.reduce((a, b) => a + b, 0) / dos.length).toFixed(2) : 0,
        temperature: temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0,
        pressure: pressures.length ? (pressures.reduce((a, b) => a + b, 0) / pressures.length).toFixed(1) : 0,
      };
    });
};
