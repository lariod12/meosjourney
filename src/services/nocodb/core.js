/**
 * NocoDB Service
 * Handles all NocoDB API interactions for the application
 *
 * Configuration:
 * - VITE_NOCODB_USE_STATIC=true: Use static JSON file (for offline development)
 * - VITE_NOCODB_USE_STATIC=false: Use real NocoDB API (requires valid token)
 *
 * API Token: Set in .env.development as VITE_NOCODB_TOKEN
 */

import { CHARACTER_ID } from '../../config/constants';

export const NOCODB_BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL;
export const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
export const USE_STATIC_DATA = import.meta.env.VITE_NOCODB_USE_STATIC === 'true';

// Export CHARACTER_ID for use in other modules
export { CHARACTER_ID };

// Table IDs from NocoDB export
const TABLE_IDS_PRODUCTION = {
  STATUS: 'm0ik9l51n1dpn5a',
  PROFILE: 'mzm3hqgjmjh1mwz',
  CONFIG: 'm6ylndnmg21ecr2',
  HISTORY: 'me4mvbozt7qzr8u',
  JOURNALS: 'mijt02urzahbr2g',
  QUESTS: 'm2l33arlwkxniov',
  QUESTS_CONFIRM: 'muv829m3xzzcvm7',
  ACHIEVEMENTS: 'm4m6vrb5ylqoqxn',
  ACHIEVEMENTS_CONFIRM: 'mcynwxx2hpgcolt',
  ATTACHMENTS_GALLERY: 'mirssuqhjx529p5',
  ATTACHMENTS_ALBUM: 'mc6wu0v542g2bnr',
  PET: null
};

const TABLE_IDS_DEVELOPE = {
  STATUS: 'myzr03ds9q74zkp',
  PROFILE: 'm05nuwsedf20qp3',
  CONFIG: 'mes7u9lklksi0eh',
  HISTORY: 'm4k0ibuhxemhz7l',
  JOURNALS: 'medcjhz2xd8ynxw',
  QUESTS: 'mc8ntiumxfjxso1',
  QUESTS_CONFIRM: 'mt2865bgwsejxhz',
  ACHIEVEMENTS: 'mbvnmjgyovlitbc',
  ACHIEVEMENTS_CONFIRM: 'mv0l9jz8fhf1gjl',
  ATTACHMENTS_GALLERY: 'mpp72hgqxpn2p3k',
  ATTACHMENTS_ALBUM: 'mkwz7hrtyzkvji6',
  PET: null
};

const TABLE_IDS_STAGING = {
  STATUS: 'ms8en1op7vwznus',
  PROFILE: 'mntx3zoatts0mqs',
  CONFIG: 'mfknw80a7z9yq4k',
  HISTORY: 'm6gg7iz2652psmg',
  JOURNALS: 'm2vhvjmajhe57m1',
  QUESTS: 'm5zdtosf0at9r5e',
  QUESTS_CONFIRM: 'm9mcryxflb74irn',
  ACHIEVEMENTS: 'mn5q6w7t05bamhd',
  ACHIEVEMENTS_CONFIRM: 'mlayyfujdqnghzb',
  ATTACHMENTS_GALLERY: 'mc8mv7di4aadfz1',
  ATTACHMENTS_ALBUM: 'mi5yptema60aqcq',
  PET: 'mjpwruy1wibuf7l'
};

// Use appropriate table IDs based on environment
export const TABLE_IDS = import.meta.env.MODE === 'production' ? TABLE_IDS_PRODUCTION : 
                  import.meta.env.MODE === 'staging' ? TABLE_IDS_STAGING : 
                  TABLE_IDS_DEVELOPE;

// Helper function to check if current mode should use production behavior
export const isProductionMode = () => import.meta.env.MODE === 'production' || import.meta.env.MODE === 'staging';

export const parseNocoDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const isoCandidate = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
    const date = new Date(isoCandidate);
    if (!Number.isNaN(date.getTime())) return date;
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Helper function to generate UTC+7 timestamp with milliseconds for uniqueness
export const getUTC7Timestamp = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  // Add milliseconds for uniqueness (prevent duplicate key constraint)
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}+07:00`;
};

// Debug: Log current mode and table IDs (development and staging only)
if (!isProductionMode()) {
  const envName = import.meta.env.MODE === 'staging' ? 'STAGING' : 
                  import.meta.env.MODE === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`🔧 NocoDB Mode: ${import.meta.env.MODE}, Using ${envName} table IDs`);
}

// Track in-flight requests (prevents duplicate concurrent calls, e.g. React StrictMode)
const pendingRequests = new Map();

// Request throttling to prevent rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = isProductionMode() ? 900 : 300;

const LAST_REQUEST_TIME_KEY = 'meo_noco_last_request_time';
const PENALTY_UNTIL_KEY = 'meo_noco_penalty_until';

const getPersistedLastRequestTime = () => {
  try {
    const v = localStorage.getItem(LAST_REQUEST_TIME_KEY);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const setPersistedLastRequestTime = (time) => {
  try {
    localStorage.setItem(LAST_REQUEST_TIME_KEY, String(time));
  } catch {
  }
};

const getPersistedPenaltyUntil = () => {
  try {
    const v = localStorage.getItem(PENALTY_UNTIL_KEY);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const setPersistedPenaltyUntil = (time) => {
  try {
    localStorage.setItem(PENALTY_UNTIL_KEY, String(time));
  } catch {
  }
};

let penaltyUntil = 0;

const MAX_CONCURRENT_REQUESTS = isProductionMode() ? 1 : 2;
let activeRequests = 0;
const requestWaiters = [];

const acquireRequestSlot = async () => {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }

  await new Promise((resolve) => requestWaiters.push(resolve));
  activeRequests += 1;
};

const releaseRequestSlot = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = requestWaiters.shift();
  if (next) next();
};

// Deduplicate concurrent requests - if same request is in-flight, return the same promise
export const deduplicateRequest = async (key, requestFn) => {
  // Check if request is already in-flight
  if (pendingRequests.has(key)) {
    // Debug: Log waiting request (development only)
    if (!isProductionMode()) {
      console.log(`⏳ Waiting for in-flight request: ${key}`);
    }
    return pendingRequests.get(key);
  }

  // Execute the request and store the promise
  const promise = requestFn()
    .then(data => {
      pendingRequests.delete(key);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * Clear all cached requests
 * Use this when you need to force fresh data (e.g., after updates)
 */
export const clearNocoDBCache = () => {
  pendingRequests.clear();
  // Debug: Log cache cleared (development only)
  if (!isProductionMode()) {
    console.log('🗑️ NocoDB cache cleared');
  }
};

/**
 * Clear specific cached request by key
 */
export const clearCachedRequest = (key) => {
  pendingRequests.delete(key);
};

/**
 * Fetch static data from public folder (development mode)
 */
export const fetchStaticData = async () => {
  const response = await fetch('/nocodb-data.json');
  if (!response.ok) {
    throw new Error('Failed to fetch static NocoDB data');
  }
  return response.json();
};

/**
 * Make a request to NocoDB API with retry logic for rate limiting
 * Requests are executed in parallel when using Promise.all for better performance
 */
export const nocoRequest = async (endpoint, options = {}, retries = 3) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${endpoint}`;

  if (!NOCODB_BASE_URL) {
    throw new Error('Missing VITE_NOCODB_BASE_URL');
  }

  if (!NOCODB_TOKEN) {
    throw new Error('Missing VITE_NOCODB_TOKEN');
  }

  await acquireRequestSlot();

  try {
    // Throttle requests to prevent rate limiting
    const persistedLastRequestTime = getPersistedLastRequestTime();
    const effectiveLastRequestTime = Math.max(lastRequestTime, persistedLastRequestTime);

    const persistedPenaltyUntil = getPersistedPenaltyUntil();
    const effectivePenaltyUntil = Math.max(penaltyUntil, persistedPenaltyUntil);

    let now = Date.now();
    if (effectivePenaltyUntil > now) {
      await new Promise(resolve => setTimeout(resolve, effectivePenaltyUntil - now));
      now = Date.now();
    }
    const timeSinceLastRequest = now - effectiveLastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    const stampedNow = Date.now();
    lastRequestTime = stampedNow;
    setPersistedLastRequestTime(stampedNow);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'xc-token': NOCODB_TOKEN,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('retry-after');
          let retryAfterMs = 0;
          if (retryAfterHeader) {
            const retryAfterSeconds = Number(retryAfterHeader);
            if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
              retryAfterMs = retryAfterSeconds * 1000;
            } else {
              const retryAfterDate = new Date(retryAfterHeader);
              const retryAfterTime = retryAfterDate.getTime();
              if (!Number.isNaN(retryAfterTime)) {
                retryAfterMs = Math.max(0, retryAfterTime - Date.now());
              }
            }
          }

          const baseDelay = isProductionMode() ? 3000 : 1500;
          const exponentialDelay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 350);
          const delay = Math.min(45000, Math.max(retryAfterMs, exponentialDelay) + jitter);

          penaltyUntil = Date.now() + delay;
          setPersistedPenaltyUntil(penaltyUntil);
          if (attempt < retries) {
            console.warn(`⚠️ Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`NocoDB API rate limit exceeded after ${retries} retries`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          let errorDetail;
          try {
            errorDetail = JSON.parse(errorText);
          } catch {
            errorDetail = errorText;
          }
          console.error('❌ NocoDB API error:', {
            status: response.status,
            statusText: response.statusText,
            url,
            method: options.method || 'GET',
            errorDetail
          });
          throw new Error(`NocoDB API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
        }

        return response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        const baseDelay = import.meta.env.MODE === 'staging' ? 2500 : 1500;
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    releaseRequestSlot();
  }
};

/**
 * Fetch status data from NocoDB
 * Returns the first (and only) status record
 */
