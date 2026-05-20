/**
 * Open-Meteo Weather API Service
 * Free weather API without API key requirement
 * Docs: https://open-meteo.com/en/docs
 */

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';
const GEOLOCATION_TIMEOUT_MS = 2500;
const GEOLOCATION_MAX_AGE_MS = 10 * 60 * 1000;
const WEATHER_API_TIMEOUT_MS = 4500;
const WEATHER_CACHE_KEY = 'meo-current-weather-cache-v1';
const WEATHER_CACHE_TTL_MS = 3 * 60 * 1000;
const VIETNAM_DEFAULT_LOCATION = {
  latitude: 10.7769,
  longitude: 106.7009,
  label: 'Ho Chi Minh City, Vietnam',
  source: 'vietnam-fallback'
};
const MIN_VISIBLE_RAIN_MM = 0.3;

/**
 * Get user's current geolocation
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAX_AGE_MS,
      }
    );
  });
};

const readWeatherCache = () => {
  try {
    if (typeof localStorage === 'undefined') return null;

    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    if (!payload?.data || !payload.savedAt) return null;
    if (Date.now() - payload.savedAt > WEATHER_CACHE_TTL_MS) return null;

    return payload.data;
  } catch {
    return null;
  }
};

const writeWeatherCache = (data) => {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data
    }));
  } catch {
  }
};

const getWeatherLocation = async () => {
  try {
    return {
      ...(await getCurrentLocation()),
      source: 'device'
    };
  } catch (error) {
    console.warn('Failed to get device location, using Vietnam fallback:', error);
    return VIETNAM_DEFAULT_LOCATION;
  }
};

/**
 * Fetch current weather from Open-Meteo API
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{temperature: number, unit: string, weatherCode: number, precipitation: number, rain: number}>}
 */
export const fetchCurrentWeather = async (latitude, longitude) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), WEATHER_API_TIMEOUT_MS)
    : null;

  try {
    const url = `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,precipitation,rain&timezone=auto`;

    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: data.current.temperature_2m,
      unit: data.current_units.temperature_2m,
      weatherCode: data.current.weather_code,
      precipitation: data.current.precipitation || 0,
      rain: data.current.rain || 0,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

/**
 * Get current temperature with automatic location detection
 * @returns {Promise<{temperature: number, unit: string, location: {latitude: number, longitude: number}, weatherCode: number, precipitation: number, rain: number}>}
 */
export const getCurrentTemperature = async () => {
  try {
    const location = await getWeatherLocation();
    const weather = await fetchCurrentWeather(location.latitude, location.longitude);

    return {
      ...weather,
      location,
    };
  } catch (error) {
    console.error('Failed to get current temperature:', error);
    throw error;
  }
};

/**
 * Map Open-Meteo weather code to rain variant
 * Weather codes: https://open-meteo.com/en/docs
 * @param {number} weatherCode - WMO Weather interpretation code
 * @param {number} precipitation - Precipitation in mm
 * @param {number} rain - Rain in mm
 * @returns {'drizzle' | 'light' | 'heavy' | null}
 */
export const mapWeatherCodeToRainVariant = (weatherCode, precipitation = 0, rain = 0) => {
  const rainAmount = Math.max(Number(precipitation) || 0, Number(rain) || 0);

  if (rainAmount < MIN_VISIBLE_RAIN_MM) {
    return null;
  }

  // Drizzle codes: 51, 53, 55, 56, 57
  if (weatherCode >= 51 && weatherCode <= 57) {
    return rainAmount >= 2.5 ? 'light' : 'drizzle';
  }

  // Rain codes: 61, 63, 65, 66, 67, 80, 81, 82
  if (weatherCode >= 61 && weatherCode <= 67) {
    // 61 = slight rain, 63 = moderate, 65 = heavy
    if (weatherCode === 61) return rainAmount > 0 && rainAmount < 0.8 ? 'drizzle' : 'light';
    if (weatherCode === 63) return rainAmount >= 4 ? 'heavy' : 'light';
    if (weatherCode === 65) return 'heavy';
    if (weatherCode === 66 || weatherCode === 67) return 'heavy'; // freezing rain
  }

  // Shower codes: 80, 81, 82
  if (weatherCode >= 80 && weatherCode <= 82) {
    if (weatherCode === 80) return rainAmount > 0 && rainAmount < 0.8 ? 'drizzle' : 'light';
    if (weatherCode === 81) return rainAmount >= 4 ? 'heavy' : 'light';
    if (weatherCode === 82) return 'heavy';
  }

  // Thunderstorm codes: 95, 96, 99
  if (weatherCode >= 95 && weatherCode <= 99) {
    return 'heavy';
  }

  // Fallback: use precipitation amount
  if (rainAmount > 0) {
    if (rainAmount < 0.8) return 'drizzle';
    if (rainAmount < 4) return 'light';
    return 'heavy';
  }

  return null;
};

/**
 * Get current weather with rain variant
 * @returns {Promise<{temperature: number, weatherCode: number, precipitation: number, rain: number, rainVariant: 'drizzle' | 'light' | 'heavy' | null, location: {latitude: number, longitude: number}}>}
 */
export const getCurrentWeatherWithRain = async ({ allowCache = true } = {}) => {
  try {
    if (allowCache) {
      const cachedWeather = readWeatherCache();
      if (cachedWeather) {
        return cachedWeather;
      }
    }

    const weather = await getCurrentTemperature();
    const rainVariant = mapWeatherCodeToRainVariant(weather.weatherCode, weather.precipitation, weather.rain);

    const weatherWithRain = {
      ...weather,
      rainVariant,
    };

    writeWeatherCache(weatherWithRain);

    return weatherWithRain;
  } catch (error) {
    console.error('Failed to get weather with rain:', error);
    throw error;
  }
};

/**
 * Calculate thermometer fill percentage based on temperature
 * Maps temperature range to 0-100% fill
 * @param {number} temperature - Temperature in Celsius
 * @returns {number} Fill percentage (0-100)
 */
export const calculateThermometerFill = (temperature) => {
  // Temperature range mapping:
  // -10°C = 0%
  // 0°C = 20%
  // 15°C = 40%
  // 25°C = 60%
  // 35°C = 80%
  // 45°C = 100%

  const minTemp = -10;
  const maxTemp = 45;

  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));
  const fill = ((clampedTemp - minTemp) / (maxTemp - minTemp)) * 100;

  return Math.round(fill);
};
