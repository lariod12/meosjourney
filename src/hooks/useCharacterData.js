import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatus, fetchProfile, fetchConfig } from '../services';

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
      const [status, profile, config] = await Promise.all([
        fetchStatus(),
        fetchProfile(),
        fetchConfig()
      ]);

      if (mountedRef.current) {
        // Merge with default data
        const mergedData = {
          ...defaultData,
          // Profile data
          name: profile?.title || defaultData.name,
          caption: profile?.caption || defaultData.caption,
          currentXP: profile?.currentXP || defaultData.currentXP || 0,
          maxXP: profile?.maxXP || defaultData.maxXP || 1000,
          introduce: profile?.introduce || defaultData.introduce || '',
          interests: profile?.interests?.map(name => ({ name })) || defaultData.interests || [],
          
          // Status data
          status: {
            doing: status?.doing || defaultData.status?.doing || [],
            location: status?.location || defaultData.status?.location || [],
            moods: status?.moods || defaultData.status?.moods || [],
            timestamp: status?.timestamp ? new Date(status.timestamp) : new Date()
          },

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
