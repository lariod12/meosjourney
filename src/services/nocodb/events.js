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

const normalizeStinkyEventObject = (value = {}) => ({
  ...value,
  enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
  dateKey: typeof value.dateKey === 'string' ? value.dateKey.trim() : '',
  dailyTriggers: Number.isFinite(Number(value.dailyTriggers)) ? Number(value.dailyTriggers) : 2,
  sanityPenalty: Number.isFinite(Number(value.sanityPenalty)) ? Number(value.sanityPenalty) : 15,
  requiredCareItem: typeof value.requiredCareItem === 'string' ? value.requiredCareItem.trim() : 'Shower',
  scheduleStartHour: Number.isFinite(Number(value.scheduleStartHour)) ? Number(value.scheduleStartHour) : 8,
  scheduleEndHour: Number.isFinite(Number(value.scheduleEndHour)) ? Number(value.scheduleEndHour) : 24,
  active: value.active === true,
  activeTriggerId: typeof value.activeTriggerId === 'string' ? value.activeTriggerId : null,
  schedule: Array.isArray(value.schedule) ? value.schedule : [],
  lastTriggeredAt: value.lastTriggeredAt ?? null,
  lastClearedAt: value.lastClearedAt ?? null
});

const normalizeStinkyEvent = (value) => {
  if (!value) {
    return {
      enabled: true,
      dateKey: '',
      dailyTriggers: 2,
      sanityPenalty: 15,
      requiredCareItem: 'Shower',
      scheduleStartHour: 8,
      scheduleEndHour: 24,
      active: false,
      activeTriggerId: null,
      schedule: [],
      lastTriggeredAt: null,
      lastClearedAt: null
    };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? normalizeStinkyEventObject(parsed)
        : normalizeStinkyEvent();
    } catch {
      return normalizeStinkyEvent();
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? normalizeStinkyEventObject(value)
    : normalizeStinkyEvent();
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
          birthday: { date: '', enabled: false },
          stinky: normalizeStinkyEvent()
        };
      }

      const record = await getPetEventsRecord();
      return {
        mosquito: normalizeMosquitoEvent(record?.mosquito),
        birthday: normalizeBirthdayEvent(record?.birthday),
        stinky: normalizeStinkyEvent(record?.stinky)
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
    const mosquitoEvent = normalizeMosquitoEvent(
      Object.prototype.hasOwnProperty.call(events, 'mosquito')
        ? events.mosquito
        : currentRecord?.mosquito
    );
    const birthdayEvent = normalizeBirthdayEvent(
      Object.prototype.hasOwnProperty.call(events, 'birthday')
        ? events.birthday
        : currentRecord?.birthday
    );
    const stinkyEvent = normalizeStinkyEvent(
      Object.prototype.hasOwnProperty.call(events, 'stinky')
        ? events.stinky
        : currentRecord?.stinky
    );
    const payload = {
      title: PET_EVENTS_TITLE,
      mosquito: mosquitoEvent,
      birthday: birthdayEvent,
      stinky: stinkyEvent
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
