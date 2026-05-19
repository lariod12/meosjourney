/**
 * Open-Meteo Weather API Service
 * Free weather API without API key requirement
 * Docs: https://open-meteo.com/en/docs
 */

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

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
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
};

/**
 * Fetch current weather from Open-Meteo API
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{temperature: number, unit: string}>}
 */
export const fetchCurrentWeather = async (latitude, longitude) => {
  try {
    const url = `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: data.current.temperature_2m,
      unit: data.current_units.temperature_2m,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    throw error;
  }
};

/**
 * Get current temperature with automatic location detection
 * @returns {Promise<{temperature: number, unit: string, location: {latitude: number, longitude: number}}>}
 */
export const getCurrentTemperature = async () => {
  try {
    const location = await getCurrentLocation();
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
