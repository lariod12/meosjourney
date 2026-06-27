import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, fetchProfile, fetchConfig, fetchTodayJournals, fetchQuests, fetchAchievements } from '../services';

const HOME_DATA_CACHE_KEY = 'meo_home_data_snapshot';
const HOME_DATA_CACHE_TTL = 15 * 60 * 1000;

/**
 * Preload image with reduced timeout for faster page load
 * Returns quickly if image loads, or after timeout (non-blocking)
 */
const preloadImage = (url, timeoutMs = 5000) => {
  if (!url) return Promise.resolve(false);

  return new Promise((resolve) => {
    let done = false;
    let timer = null;
    const img = new Image();

    const finish = (ok) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      resolve(ok);
    };

    // Reduced timeout from 12s to 5s for faster page load
    timer = setTimeout(() => finish(false), timeoutMs);

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Decode failed, but image loaded - still OK
      }
      finish(true);
    };

    img.onerror = () => finish(false);
    img.src = url;

    if (img.complete) {
      img.onload?.();
    }
  });
};

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
  avatarLoading: false,
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
    const { config, ...cacheableData } = data;
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
  avatarUrl: profile?.avatarUrl || baseData.avatarUrl || null,
  avatarLoading: false,
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
        if (prev?.avatarUrl || prev?.avatarLoading) return prev;
        return { ...prev, avatarLoading: true };
      });

      // First paint only needs profile/status. Other data hydrates in the background.
      const statusPromise = fetchStatus().catch((statusError) => {
        console.warn('⚠️ Failed to fetch status:', statusError);
        return null;
      });

      const profilePromise = fetchProfile({ includeAvatar: true }).catch((profileError) => {
        console.warn('⚠️ Failed to fetch profile:', profileError);
        return null;
      });

      const [status, profile] = await Promise.all([
        statusPromise,
        profilePromise
      ]);

      if (shouldUseResult()) {
        if (profile?.avatarUrl) {
          await preloadImage(profile.avatarUrl, 3000);
        }
        if (!shouldUseResult()) return;

        setData(prev => {
          const nextData = mergeProfileStatusData(prev, defaultData, profile, status);
          writeHomeDataCache(nextData);
          return nextData;
        });
        setLoading(false);
        setError(null);

        Promise.all([
          fetchTodayJournals({ source: 'daily' }).catch((journalsError) => {
            console.warn('⚠️ Failed to fetch journals:', journalsError);
            return null;
          }),
          fetchConfig().catch((configError) => {
            console.warn('⚠️ Failed to fetch config:', configError);
            return null;
          })
        ])
          .then(([journals, config]) => {
            if (!shouldUseResult()) return;
            setData(prev => {
              const updated = {
                ...prev,
                journal: journals || [],
                config: config || {}
              };
              writeHomeDataCache(updated);
              return updated;
            });
          });

        Promise.all([fetchQuests(), fetchAchievements()])
          .then(([quests, achievements]) => {
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
          })
          .catch((bgError) => {
            console.warn('⚠️ Background load failed (quests/achievements):', bgError);
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
