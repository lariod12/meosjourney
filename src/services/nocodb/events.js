import { TABLE_IDS, clearCachedRequest, deduplicateRequest, nocoRequest } from './core.js';

const EVENTS_CACHE_KEY = 'events';
const PET_EVENTS_TITLE = 'events';

const normalizeMosquitoEventObject = (value = {}) => {
  const { clearedDate: _legacyClearedDate, ...cleanedValue } = value;
  return {
    completedAt: cleanedValue.completedAt ?? null,
    ...cleanedValue
  };
};

const normalizeMosquitoEvent = (value) => {
  if (!value) {
    return { completedAt: null };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? normalizeMosquitoEventObject(parsed)
        : { completedAt: null };
    } catch {
      return { completedAt: null };
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? normalizeMosquitoEventObject(value)
    : { completedAt: null };
};

const normalizeBirthdayEventObject = (value = {}) => ({
  date: typeof value.date === 'string' ? value.date.trim() : '',
  enabled: typeof value.enabled === 'boolean' ? value.enabled : true
});

const normalizeBirthdayEvent = (value) => {
  if (!value) {
    return { date: '', enabled: false };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? normalizeBirthdayEventObject(parsed)
        : { date: '', enabled: false };
    } catch {
      return { date: '', enabled: false };
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? normalizeBirthdayEventObject(value)
    : { date: '', enabled: false };
};

const getPetEventsRecord = async () => {
  if (!TABLE_IDS.EVENTS) {
    return null;
  }

  const data = await nocoRequest(`${TABLE_IDS.EVENTS}/records?pageSize=25`, {
    method: 'GET'
  });

  const records = Array.isArray(data.list) ? data.list : [];
  return records.find((record) => (
    String(record.title || record.Title || '').trim().toLowerCase() === PET_EVENTS_TITLE
  )) || null;
};

export const fetchPetEvents = async () => (
  deduplicateRequest(EVENTS_CACHE_KEY, async () => {
    try {
      if (!TABLE_IDS.EVENTS) {
        return {
          mosquito: { completedAt: null },
          birthday: { date: '', enabled: false }
        };
      }

      const record = await getPetEventsRecord();
      return {
        mosquito: normalizeMosquitoEvent(record?.mosquito),
        birthday: normalizeBirthdayEvent(record?.birthday)
      };
    } catch (error) {
      console.error('❌ Error fetching pet events from NocoDB:', error);
      throw error;
    }
  })
);

export const savePetEvents = async (events = {}) => {
  try {
    if (!TABLE_IDS.EVENTS) {
      return { success: false, message: 'Events table is not configured for this environment' };
    }

    const currentRecord = await getPetEventsRecord();
    const mosquitoEvent = normalizeMosquitoEvent(events?.mosquito);
    const birthdayEvent = normalizeBirthdayEvent(
      Object.prototype.hasOwnProperty.call(events, 'birthday')
        ? events.birthday
        : currentRecord?.birthday
    );
    const payload = {
      title: PET_EVENTS_TITLE,
      mosquito: mosquitoEvent,
      birthday: birthdayEvent
    };

    const response = currentRecord?.Id
      ? await nocoRequest(`${TABLE_IDS.EVENTS}/records`, {
        method: 'PATCH',
        body: JSON.stringify([{
          Id: currentRecord.Id,
          ...payload
        }])
      })
      : await nocoRequest(`${TABLE_IDS.EVENTS}/records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

    clearCachedRequest(EVENTS_CACHE_KEY);
    return { success: true, message: 'Pet events updated', data: response };
  } catch (error) {
    console.error('❌ Error saving pet events to NocoDB:', error);
    return { success: false, message: error.message };
  }
};
