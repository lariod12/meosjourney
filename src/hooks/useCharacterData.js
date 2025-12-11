import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, fetchProfile, fetchConfig, fetchJournals, fetchAllJournals, fetchQuests, fetchAchievements } from '../services';
import { getCachedData, setCachedData, canRefresh, setRefreshCooldown, getRemainingCooldown } from '../utils/cacheManager';

/**
 * Custom hook for fetching character data
 * Fetches data from NocoDB (primary data source)
 * Implements 1-minute refresh cooldown to prevent spam
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
  const dataLoadedRef = useRef(false); // Track if data has been loaded successfully

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    // Check refresh cooldown (only after initial load)
    if (dataLoadedRef.current && !forceRefresh && !canRefresh()) {
      const remainingSeconds = getRemainingCooldown();
      return;
    }

    // Try to use cached data first (only on initial load)
    if (!forceRefresh && !dataLoadedRef.current) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('✅ Using cached data, journals count:', cachedData.journal?.length || 0);
        setData(cachedData);
        setLoading(false);
        dataLoadedRef.current = true;
        return;
      }
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Critical batch: status, profile, config, and today's journal
      const [status, profile, config, journals] = await Promise.all([
        fetchStatus(),
        fetchProfile(),
        fetchConfig(),
        fetchJournals(7)
      ]);

      if (mountedRef.current) {
        // Merge with default data
        const mergedData = {
          ...defaultData,
          // Profile data
          name: profile?.name || defaultData.name,
          caption: profile?.caption || defaultData.caption,
          currentXP: profile?.currentXP || defaultData.currentXP || 0,
          maxXP: profile?.maxXP || defaultData.maxXP || 1000,
          level: profile?.level || defaultData.level || 0,
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
        dataLoadedRef.current = true;

        // Cache the data after successful load
        setCachedData(mergedData);
        
        // Set refresh cooldown after successful fetch
        setRefreshCooldown();

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
            setCachedData(updated);
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
