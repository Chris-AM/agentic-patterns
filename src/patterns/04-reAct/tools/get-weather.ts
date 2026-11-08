import { tool } from 'ai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// HERRAMIENTA 3 — el clima, contra la API real
// ---------------------------------------------------------------------------

/** Códigos WMO, traducidos a algo legible. */
const WEATHER_CODES: Record<number, string> = {
  0: 'despejado',
  1: 'mayormente despejado',
  2: 'parcialmente nublado',
  3: 'nublado',
  45: 'niebla',
  48: 'niebla con escarcha',
  51: 'llovizna ligera',
  53: 'llovizna moderada',
  55: 'llovizna intensa',
  61: 'lluvia ligera',
  63: 'lluvia moderada',
  65: 'lluvia intensa',
  71: 'nevada ligera',
  73: 'nevada moderada',
  75: 'nevada intensa',
  80: 'chubascos',
  95: 'tormenta',
};

export const getWeather = tool({
  description:
    'Consulta el clima actual para unas coordenadas geográficas. ' +
    'Requiere latitud y longitud, que se obtienen de geocodeCity.',
  inputSchema: z.object({
    latitude: z.number().describe('Latitud. ej: 45.41'),
    longitude: z.number().describe('Longitud. ej: -75.70'),
  }),
  execute: async ({ latitude, longitude }) => {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,wind_speed_10m,weather_code' +
      '&timezone=auto';

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { error: `La API respondió ${response.status}` };
      }

      const data = await response.json();
      const current = data.current;

      return {
        temperatureC: current.temperature_2m,
        windSpeedKmh: current.wind_speed_10m,
        conditions: WEATHER_CODES[current.weather_code] ?? 'desconocido',
        timezone: data.timezone,
        observedAt: current.time,
      };
    } catch (error) {
      return { error: `No se pudo consultar la API: ${String(error)}` };
    }
  },
});
