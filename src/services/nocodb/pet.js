import { TABLE_IDS, clearCachedRequest, deduplicateRequest, nocoRequest } from './core.js';

const PET_CACHE_KEY = 'pet';
const PET_RECORD_TITLE = 'pet';

const parseJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (typeof value !== 'string') {
    return [value];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const normalizePetItem = (item) => {
  if (item && typeof item === 'object') {
    const name = typeof item.name === 'string' ? item.name.trim() : String(item.name || '').trim();
    const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
    const desc = typeof item.desc === 'string' ? item.desc.trim() : '';
    return name ? { name, icon, desc } : null;
  }

  const name = typeof item === 'string' ? item.trim() : String(item || '').trim();
  return name ? { name, icon: '', desc: '' } : null;
};

const normalizePetItems = (value) => (
  parseJsonArray(value)
    .map(normalizePetItem)
    .filter(Boolean)
);

const normalizeStatusNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeTimestamp = (value) => {
  const timestamp = typeof value === 'string' ? value.trim() : String(value || '').trim();
  return timestamp || null;
};

const setNumberUpdate = (updates, fieldName, value) => {
  const numberValue = Number(value);
  if (Number.isFinite(numberValue)) {
    updates[fieldName] = numberValue;
  }
};

let shouldSkipLastStatusTickAt = false;

const getPetRecord = async () => {
  if (!TABLE_IDS.PET) {
    return null;
  }

  const data = await nocoRequest(`${TABLE_IDS.PET}/records?pageSize=25`, {
    method: 'GET'
  });

  const records = Array.isArray(data.list) ? data.list : [];
  return records.find((record) => (
    String(record.Title || record.title || '').trim().toLowerCase() === PET_RECORD_TITLE
  )) || records[0] || null;
};

const toPetData = (record) => {
  if (!record) {
    return null;
  }

  return {
    id: record.Id,
    title: record.Title || record.title || PET_RECORD_TITLE,
    food: normalizePetItems(record.food),
    care: normalizePetItems(record.care),
    status: {
      health: normalizeStatusNumber(record.status_health),
      hunger: normalizeStatusNumber(record.status_hunger),
      sanity: normalizeStatusNumber(record.status_sanity)
    },
    lastStatusTickAt: normalizeTimestamp(record.last_status_tick_at),
    createdAt: record.CreatedAt,
    updatedAt: record.UpdatedAt
  };
};

export const fetchPet = async () => (
  deduplicateRequest(PET_CACHE_KEY, async () => {
    try {
      if (!TABLE_IDS.PET) {
        return null;
      }

      return toPetData(await getPetRecord());
    } catch (error) {
      console.error('❌ Error fetching pet from NocoDB:', error);
      throw error;
    }
  })
);

export const savePet = async (petUpdates = {}) => {
  try {
    if (!TABLE_IDS.PET) {
      return { success: false, message: 'Pet table is not configured for this environment' };
    }

    const updates = {};

    if (petUpdates.food !== undefined) {
      updates.food = normalizePetItems(petUpdates.food);
    }

    if (petUpdates.care !== undefined) {
      updates.care = normalizePetItems(petUpdates.care);
    }

    const status = petUpdates.status || {};
    if (status.health !== undefined) {
      setNumberUpdate(updates, 'status_health', status.health);
    }
    if (status.hunger !== undefined) {
      setNumberUpdate(updates, 'status_hunger', status.hunger);
    }
    if (status.sanity !== undefined) {
      setNumberUpdate(updates, 'status_sanity', status.sanity);
    }

    const lastStatusTickAt = petUpdates.lastStatusTickAt ?? petUpdates.last_status_tick_at;
    if (lastStatusTickAt !== undefined && !shouldSkipLastStatusTickAt) {
      updates.last_status_tick_at = normalizeTimestamp(lastStatusTickAt);
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No pet data to save' };
    }

    const currentRecord = await getPetRecord();
    const saveUpdates = async (nextUpdates) => {
      const retryCount = Object.prototype.hasOwnProperty.call(nextUpdates, 'last_status_tick_at') ? 0 : undefined;

      if (currentRecord?.Id) {
        return nocoRequest(`${TABLE_IDS.PET}/records`, {
          method: 'PATCH',
          body: JSON.stringify([{
            Id: currentRecord.Id,
            ...nextUpdates
          }])
        }, retryCount);
      }

      return nocoRequest(`${TABLE_IDS.PET}/records`, {
        method: 'POST',
        body: JSON.stringify({
          Title: PET_RECORD_TITLE,
          ...nextUpdates
        })
      }, retryCount);
    };

    let response;
    try {
      response = await saveUpdates(updates);
    } catch (error) {
      if (!Object.prototype.hasOwnProperty.call(updates, 'last_status_tick_at')) {
        throw error;
      }

      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.last_status_tick_at;
      shouldSkipLastStatusTickAt = true;
      console.warn('⚠️ Pet status tick timestamp could not be saved. Retrying pet update without last_status_tick_at.', error);
      response = Object.keys(fallbackUpdates).length > 0
        ? await saveUpdates(fallbackUpdates)
        : null;
    }

    clearCachedRequest(PET_CACHE_KEY);
    return { success: true, message: 'Pet updated', data: response };
  } catch (error) {
    console.error('❌ Error saving pet to NocoDB:', error);
    return { success: false, message: error.message };
  }
};
