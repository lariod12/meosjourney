import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, fetchProfile, fetchConfig, fetchTodayJournals, fetchQuests, fetchAchievements } from '../services';

/**
 * Custom hook for fetching character data
 * Fetches data from NocoDB (primary data source)
 * 
 * @param {Object} defaultData - Default character data
 * @returns {Object} { data, loading, error, refetch }
 */
export const useCharacterData = (defaultData) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Critical batch: status, profile, config, and today's journal
      const statusPromise = fetchStatus().catch((statusError) => {
        console.warn('⚠️ Failed to fetch status:', statusError);
        return null;
      });
      const configPromise = fetchConfig().catch((configError) => {
        console.warn('⚠️ Failed to fetch config:', configError);
        return null;
      });
      const journalsPromise = fetchTodayJournals({ source: 'daily' }).catch((journalsError) => {
        console.warn('⚠️ Failed to fetch journals:', journalsError);
        return null;
      });

      let profile = null;
      try {
        profile = await fetchProfile();
      } catch (profileError) {
        console.warn('⚠️ Failed to fetch profile:', profileError);
      }

      if (mountedRef.current) {
        setData((prev) => ({
          ...prev,
          name: profile?.name || prev.name || defaultData.name,
          caption: profile?.caption || prev.caption || defaultData.caption,
          currentXP: profile?.currentXP ?? prev.currentXP ?? defaultData.currentXP ?? 0,
          maxXP: profile?.maxXP ?? prev.maxXP ?? defaultData.maxXP ?? 1000,
          level: profile?.level ?? prev.level ?? defaultData.level ?? 0,
          introduce: profile?.introduce || prev.introduce || defaultData.introduce || '',
          hobbies: profile?.hobbies?.map(name => ({ name })) || prev.hobbies || defaultData.hobbies || [],
          skills: profile?.skills?.map(name => ({ name })) || prev.skills || defaultData.skills || [],
          social: profile?.social || prev.social || defaultData.social || {},
          avatarUrl: profile?.avatarUrl || prev.avatarUrl || null,
        }));
      }

      const [status, config, journals] = await Promise.all([
        statusPromise,
        configPromise,
        journalsPromise
      ]);

      if (mountedRef.current) {
        // Merge with default data
        const mergedData = {
          ...defaultData,
          // Profile data
          name: profile?.name || defaultData.name,
          caption: profile?.caption || defaultData.caption,
          currentXP: profile?.currentXP ?? defaultData.currentXP ?? 0,
          maxXP: profile?.maxXP ?? defaultData.maxXP ?? 1000,
          level: profile?.level ?? defaultData.level ?? 0,
          introduce: profile?.introduce || defaultData.introduce || '',
          // Map arrays: NocoDB returns strings, frontend expects {name: string}
          hobbies: profile?.hobbies?.map(name => ({ name })) || defaultData.hobbies || [],
          skills: profile?.skills?.map(name => ({ name })) || defaultData.skills || [],
          // Social links
          social: profile?.social || defaultData.social || {},
          // Avatar URL from NocoDB
          avatarUrl: profile?.avatarUrl || null,
          
          // Status data
          status: {
            doing: status?.doing || defaultData.status?.doing || [],
            location: status?.location || defaultData.status?.location || [],
            mood: status?.mood || defaultData.status?.mood || [],
            timestamp: status?.timestamp ? new Date(status.timestamp) : new Date()
          },

          // Journal data
          journal: journals || [],

          // Quests/Achievements will be filled in background to avoid blocking first paint
          quests: defaultData.quests || [],
          achievements: defaultData.achievements || [],

          // Config data (if needed)
          config: config || {}
        };

        setData(mergedData);
        setLoading(false);
        setError(null);

        // Background load for quests/achievements (non-blocking)
        Promise.all([fetchQuests(), fetchAchievements()])
          .then(([quests, achievements]) => {
            if (!mountedRef.current) return;
            const updated = {
              ...mergedData,
              quests: quests || defaultData.quests || [],
              achievements: achievements || defaultData.achievements || []
            };
            setData(updated);
          })
          .catch((bgError) => {
            console.warn('⚠️ Background load failed (quests/achievements):', bgError);
          });
        
      }
    } catch (err) {
      console.error('❌ Error fetching character data:', err);
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        // Keep using default data on error
        setData(defaultData);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [defaultData]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
