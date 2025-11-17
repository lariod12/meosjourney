import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, fetchProfile, fetchConfig, fetchJournals } from '../services';

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

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Fetch all data in parallel
      const [status, profile, config, journals] = await Promise.all([
        fetchStatus(),
        fetchProfile(),
        fetchConfig(),
        fetchJournals()
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
          interests: profile?.interests?.map(name => ({ name })) || defaultData.interests || [],
          skills: profile?.skills?.map(name => ({ name })) || defaultData.skills || [],
          // Social links
          social: profile?.social || defaultData.social || {},
          
          // Status data
          status: {
            doing: status?.doing || defaultData.status?.doing || [],
            location: status?.location || defaultData.status?.location || [],
            mood: status?.mood || defaultData.status?.mood || [],
            timestamp: status?.timestamp ? new Date(status.timestamp) : new Date()
          },

          // Journal data
          journal: journals || [],

          // Config data (if needed)
          config: config || {}
        };

        setData(mergedData);
        setLoading(false);
        setError(null);
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
