import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCharacterViewData, CHARACTER_ID } from '../services';
import { getCachedData, setCachedData } from '../utils/cacheManager';

/**
 * Custom hook for fetching character data with caching
 * Prevents spam refresh by using localStorage cache
 * 
 * @param {Object} defaultData - Default character data
 * @returns {Object} { data, loading, error }
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

      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          if (mountedRef.current) {
            setData(cachedData);
            setLoading(false);
          }
          fetchingRef.current = false;
          return;
        }
      }

      // Fetch fresh data from Firebase
      const freshData = await fetchCharacterViewData(CHARACTER_ID, defaultData);

      if (mountedRef.current) {
        setData(freshData);
        setCachedData(freshData);
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

  // Listen for external refresh triggers (cache cleared or explicit event)
  useEffect(() => {
    const onStorage = (e) => {
      if (e && e.key && e.key !== 'meo_journey_home_cache') return;
      // Cache mutated elsewhere -> force refresh
      fetchData(true);
    };
    const onRefresh = () => fetchData(true);
    window.addEventListener('storage', onStorage);
    window.addEventListener('meo:refresh', onRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('meo:refresh', onRefresh);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error
  };
};
