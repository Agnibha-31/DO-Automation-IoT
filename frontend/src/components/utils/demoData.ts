export const isDemoMode = () => {
  const envEnabled = String((import.meta as any)?.env?.VITE_DEMO_MODE ?? '').toLowerCase() === 'true';
  const queryEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  return envEnabled || queryEnabled;
};

export interface DemoReading {
  id: number;
  sensor_id: string;
  captured_at: number;
  timestamp: number;
  do_concentration: number;
  corrected_do: number;
  temperature: number;
  pressure: number;
  do_saturation: number;
}

const readingAt = (capturedAt: number, index: number): DemoReading => {
  const dailyPhase = (capturedAt / 86400) * Math.PI * 2;
  const shortPhase = index * 0.37;
  const temperature = 26.8 + Math.sin(dailyPhase - 1.1) * 1.35 + Math.sin(shortPhase) * 0.12;
  const pressure = 101.28 + Math.sin(dailyPhase * 0.42) * 0.48 + Math.cos(shortPhase * 0.31) * 0.08;
  const doSaturation = 97.2 + Math.sin(dailyPhase + 0.7) * 2.5 + Math.cos(shortPhase * 0.23) * 0.35;
  const correctedDo = 7.72 - (temperature - 26.8) * 0.075 + (doSaturation - 97.2) * 0.018;
  const rawDo = correctedDo - 0.16 + Math.sin(shortPhase * 0.61) * 0.035;

  return {
    id: index + 1,
    sensor_id: 'DO-KGP-2026-017',
    captured_at: capturedAt,
    timestamp: capturedAt * 1000,
    do_concentration: Number(rawDo.toFixed(3)),
    corrected_do: Number(correctedDo.toFixed(3)),
    temperature: Number(temperature.toFixed(2)),
    pressure: Number(pressure.toFixed(2)),
    do_saturation: Number(doSaturation.toFixed(2))
  };
};

export const getDemoHistory = (limit = 500): DemoReading[] => {
  const count = Math.max(1, Math.min(limit, 5000));
  const end = Math.floor(Date.now() / 1000);
  const stepSeconds = 120;
  return Array.from({ length: count }, (_, index) =>
    readingAt(end - (count - 1 - index) * stepSeconds, index)
  );
};

export const getDemoLatestReading = () => readingAt(Math.floor(Date.now() / 1000), 5001);

export const getDemoDatabaseStats = () => ({
  total_records: 48240,
  total_size_mb: 18.6,
  oldest_record: new Date(Date.now() - 67 * 86400000).toISOString(),
  newest_record: new Date().toISOString(),
  average_records_per_day: 720,
  data_points: [
    { parameter: 'Raw DO concentration', count: 48240 },
    { parameter: 'Corrected DO concentration', count: 48240 },
    { parameter: 'Temperature', count: 48240 },
    { parameter: 'Pressure', count: 48240 },
    { parameter: 'DO saturation', count: 48240 }
  ],
  retention_days: 90,
  last_updated: new Date().toISOString()
});

