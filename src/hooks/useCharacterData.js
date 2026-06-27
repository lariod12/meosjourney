import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchStatus,
  fetchProfile,
  fetchProfileAvatar,
  fetchTodayJournals,
  fetchQuests,
  fetchAchievements
} from '../services';

const HOME_DATA_CACHE_KEY = 'meo_home_data_snapshot_v2';
const HOME_DATA_CACHE_TTL = 15 * 60 * 1000;
const HOME_AVATAR_METADATA_TIMEOUT_MS = 4000;

const logHomeDataTiming = (label, startedAt) => {
  if (import.meta.env.MODE === 'production') return;
  console.log(`⏱️ Home ${label} in ${Date.now() - startedAt}ms`);
};

const resolveAfter = (ms, value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(value), ms);
});

const createInitialHomeData = (defaultData) => ({
  ...defaultData,
  avatarLoading: true,
  journal: null,
  quests: null,
  achievements: null,
  config: {}
});

const reviveHomeData = (data) => ({
  ...data,
  avatarUrl: null,
  avatarLoading: true,
  status: {
    ...(data.status || {}),
    timestamp: data.status?.timestamp ? new Date(data.status.timestamp) : new Date()
  }
});

const readHomeDataCache = () => {
  try {
    const raw = localStorage.getItem(HOME_DATA_CACHE_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    if (!payload?.data || !payload.savedAt) return null;
    if (Date.now() - payload.savedAt > HOME_DATA_CACHE_TTL) return null;

    return reviveHomeData(payload.data);
  } catch {
    return null;
  }
};

const writeHomeDataCache = (data) => {
  try {
    const { config, avatarUrl, avatarLoading, ...cacheableData } = data;
    localStorage.setItem(HOME_DATA_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data: cacheableData
    }));
  } catch {
  }
};

const mergeProfileStatusData = (baseData, defaultData, profile, status) => ({
  ...baseData,
  name: profile?.name || baseData.name || defaultData.name,
  caption: profile?.caption || baseData.caption || defaultData.caption,
  currentXP: profile?.currentXP ?? baseData.currentXP ?? defaultData.currentXP ?? 0,
  maxXP: profile?.maxXP ?? baseData.maxXP ?? defaultData.maxXP ?? 1000,
  level: profile?.level ?? baseData.level ?? defaultData.level ?? 0,
  introduce: profile?.introduce || baseData.introduce || defaultData.introduce || '',
  hobbies: profile?.hobbies?.map(name => ({ name })) || baseData.hobbies || defaultData.hobbies || [],
  skills: profile?.skills?.map(name => ({ name })) || baseData.skills || defaultData.skills || [],
  social: profile?.social || baseData.social || defaultData.social || {},
  avatarUrl: baseData.avatarUrl || null,
  avatarLoading: baseData.avatarLoading ?? true,
  status: {
    doing: status?.doing || baseData.status?.doing || defaultData.status?.doing || [],
    location: status?.location || baseData.status?.location || defaultData.status?.location || [],
    mood: status?.mood || baseData.status?.mood || defaultData.status?.mood || [],
    timestamp: status?.timestamp ? new Date(status.timestamp) : new Date()
  }
});

/**
 * Custom hook for fetching character data
 * Fetches data from NocoDB (primary data source)
 * 
 * @param {Object} defaultData - Default character data
 * @param {Object} options - Optional behavior flags
 * @param {boolean} options.enabled - Whether to start fetching immediately
 * @returns {Object} { data, loading, error, refetch }
 */
export const useCharacterData = (defaultData, options = {}) => {
  const { enabled = true } = options;
  const [initialCache] = useState(() => readHomeDataCache());
  const [data, setData] = useState(() => initialCache || createInitialHomeData(defaultData));
  const [loading, setLoading] = useState(() => enabled && !initialCache);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);
  const enabledRef = useRef(enabled);

  enabledRef.current = enabled;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) {
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    const shouldUseResult = () => (
      mountedRef.current
      && enabledRef.current
      && requestSeqRef.current === requestId
    );

    try {
      fetchingRef.current = true;
      if (forceRefresh) {
        try { localStorage.removeItem(HOME_DATA_CACHE_KEY); } catch { }
      }
      setLoading(prev => prev || forceRefresh);
      setData(prev => {
        if (prev?.avatarLoading && !forceRefresh) return prev;
        return {
          ...prev,
          avatarUrl: forceRefresh ? null : prev?.avatarUrl || null,
          avatarLoading: true
        };
      });

      const profileStartedAt = Date.now();
      const profile = await fetchProfile({ includeAvatar: false }).catch((profileError) => {
        console.warn('⚠️ Failed to fetch profile:', profileError);
        return null;
      });
      logHomeDataTiming('profile hydrated', profileStartedAt);

      if (shouldUseResult()) {
        setData(prev => {
          const nextData = mergeProfileStatusData(prev, defaultData, profile, null);
          writeHomeDataCache(nextData);
          return nextData;
        });
        setLoading(false);
        setError(null);

        const hydrateAvatar = async () => {
          const startedAt = Date.now();
          const avatarPromise = profile?.id
            ? fetchProfileAvatar(profile.id, { preferThumbnail: true })
            : Promise.resolve(null);
          const avatarUrl = await Promise.race([
            avatarPromise,
            resolveAfter(HOME_AVATAR_METADATA_TIMEOUT_MS, null)
          ]);
          logHomeDataTiming('avatar metadata hydrated', startedAt);
          if (!shouldUseResult()) return;

          setData(prev => {
            const updated = {
              ...prev,
              avatarUrl: avatarUrl || null,
              avatarLoading: false
            };
            writeHomeDataCache(updated);
            return updated;
          });

          if (!avatarUrl && profile?.id) {
            avatarPromise.then((lateAvatarUrl) => {
              if (!lateAvatarUrl || !shouldUseResult()) return;
              logHomeDataTiming('avatar metadata hydrated late', startedAt);
              setData(prev => {
                const updated = {
                  ...prev,
                  avatarUrl: lateAvatarUrl,
                  avatarLoading: false
                };
                writeHomeDataCache(updated);
                return updated;
              });
            });
          }
        };

        const hydrateJournal = async () => {
          const startedAt = Date.now();
          const journals = await fetchTodayJournals({ source: 'daily' }).catch((journalsError) => {
            console.warn('⚠️ Failed to fetch journals:', journalsError);
            return null;
          });
          logHomeDataTiming('journal hydrated', startedAt);
          if (!shouldUseResult()) return;

          setData(prev => {
            const updated = {
              ...prev,
              journal: journals || []
            };
            writeHomeDataCache(updated);
            return updated;
          });
        };

        const hydrateLists = async () => {
          const startedAt = Date.now();
          const [quests, achievements] = await Promise.all([
            fetchQuests().catch((questsError) => {
              console.warn('⚠️ Failed to fetch quests:', questsError);
              return null;
            }),
            fetchAchievements().catch((achievementsError) => {
              console.warn('⚠️ Failed to fetch achievements:', achievementsError);
              return null;
            })
          ]);
          logHomeDataTiming('quests/achievements hydrated', startedAt);
          if (!shouldUseResult()) return;

          setData(prev => {
            const updated = {
              ...prev,
              quests: quests || [],
              achievements: achievements || []
            };
            writeHomeDataCache(updated);
            return updated;
          });
        };

        const hydrateStatus = async () => {
          const startedAt = Date.now();
          const status = await fetchStatus().catch((statusError) => {
            console.warn('⚠️ Failed to fetch status:', statusError);
            return null;
          });
          logHomeDataTiming('status hydrated', startedAt);
          if (!shouldUseResult()) return;

          setData(prev => {
            const nextData = mergeProfileStatusData(prev, defaultData, null, status);
            writeHomeDataCache(nextData);
            return nextData;
          });
        };

        Promise.all([
          hydrateAvatar(),
          hydrateJournal()
        ])
          .then(hydrateLists)
          .then(hydrateStatus)
          .catch((bgError) => {
            console.warn('⚠️ Background home hydration failed:', bgError);
          });
      }
    } catch (err) {
      console.error('❌ Error fetching character data:', err);
      if (shouldUseResult()) {
        setError(err);
        setLoading(false);
        setData(prev => prev || createInitialHomeData(defaultData));
      }
    } finally {
      if (requestSeqRef.current === requestId) {
        fetchingRef.current = false;
      }
    }
  }, [defaultData, enabled]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      fetchData();
    } else {
      requestSeqRef.current += 1;
      fetchingRef.current = false;
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
