// ---------------------------------------------------------------------------
// EL GEOCODIFICADOR — el eslabón ambiguo
// ---------------------------------------------------------------------------

export type GeoMatch = {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population: number;
};

/**
 * Datos reales de la API de geocodificación de Open-Meteo.
 * Se simulan localmente para que el laboratorio sea DETERMINISTA:
 * todos los alumnos deben obtener exactamente el mismo fallo.
 */
export const GEO_DATABASE: GeoMatch[] = [
  {
    city: 'Ottawa',
    region: 'Illinois',
    country: 'Estados Unidos',
    countryCode: 'US',
    latitude: 41.35,
    longitude: -88.84,
    population: 18_342,
  },
  {
    city: 'Ottawa',
    region: 'Kansas',
    country: 'Estados Unidos',
    countryCode: 'US',
    latitude: 38.61,
    longitude: -95.26,
    population: 12_387,
  },
  {
    city: 'Ottawa',
    region: 'Ontario',
    country: 'Canadá',
    countryCode: 'CA',
    latitude: 45.41,
    longitude: -75.7,
    population: 1_017_449,
  },
  {
    city: 'Ottawa',
    region: 'Ohio',
    country: 'Estados Unidos',
    countryCode: 'US',
    latitude: 41.02,
    longitude: -84.04,
    population: 4_398,
  },
];
