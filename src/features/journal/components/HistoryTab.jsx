import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useCharacter } from '../../../contexts';
import { formatDate, formatTime } from '../../../utils/dateUtils';
import { groupJournalsByDate, translateJournalEntry } from '../../../utils/journalUtils';
import { useLanguage } from '../../../contexts';
import { fetchJournals } from '../../../services';

const HistoryTab = () => {
  const data = useCharacter();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loadedJournals, setLoadedJournals] = useState([]); // Journals loaded so far
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Whether there's more data to load
  const [currentOffset, setCurrentOffset] = useState(0);
  const { t, lang } = useLanguage();
  const scrollRefs = useRef({});
  const listRef = useRef(null);
  const LOAD_MORE_BATCH = 25; // Load 25 journals per batch (1 page)

  const MIN_DAYS_TO_SHOW = 10; // Always load enough journals to show at least 10 days
  const loadingRef = useRef(false); // Prevent concurrent loads

  // Initialize with journals from context and auto-load until we have 10 days
  useEffect(() => {
    if (data.journal && data.journal.length > 0 && loadedJournals.length === 0) {
      // First load from context
      setLoadedJournals(data.journal);
      setCurrentOffset(data.journal.length);
    }
  }, [data.journal]);

  // Auto-load more journals until we have at least 10 days
  useEffect(() => {
    const loadUntilEnoughDays = async () => {
      if (loadingRef.current || !hasMore || loadedJournals.length === 0) return;
      
      // Count unique days
      const uniqueDays = new Set(
        loadedJournals.map(j => {
          const date = j.createdAt || j.timestamp;
          if (!date) return null;
          const d = new Date(date);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }).filter(Boolean)
      );

      if (uniqueDays.size >= MIN_DAYS_TO_SHOW) return;

      loadingRef.current = true;
      try {
        const moreJournals = await fetchJournals(25, currentOffset, { source: 'history' });
        if (moreJournals.length > 0) {
          setLoadedJournals(prev => {
            const existingIds = new Set(prev.map(j => j.id));
            const newJournals = moreJournals.filter(j => !existingIds.has(j.id));
            return [...prev, ...newJournals];
          });
          setCurrentOffset(prev => prev + moreJournals.length);
          if (moreJournals.length < 25) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading journals:', error);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
      }
    };

    // Small delay to avoid rate limiting
    const timer = setTimeout(loadUntilEnoughDays, 300);
    return () => clearTimeout(timer);
  }, [loadedJournals, currentOffset, hasMore]);

  // Load more journals when scrolling near bottom
  const loadMoreJournals = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const moreJournals = await fetchJournals(LOAD_MORE_BATCH, currentOffset, { source: 'history' });
      
      if (moreJournals.length === 0) {
        // No more data
        setHasMore(false);
      } else {
        // Filter out duplicates by ID before appending
        setLoadedJournals(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJournals = moreJournals.filter(j => !existingIds.has(j.id));
          return [...prev, ...newJournals];
        });
        setCurrentOffset(prev => prev + moreJournals.length);
        
        // Check if we got less than requested (means no more data)
        if (moreJournals.length < LOAD_MORE_BATCH) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading more journals:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Removed auto-load to prevent rate limiting - user must scroll to load more

  // Detect scroll near bottom
  useEffect(() => {
    const handleScroll = (e) => {
      const element = e.target;
      const scrollPosition = element.scrollTop + element.clientHeight;
      const scrollHeight = element.scrollHeight;
      const threshold = 200; // Load more when 200px from bottom

      if (scrollHeight - scrollPosition < threshold && hasMore && !isLoadingMore) {
        loadMoreJournals();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, isLoadingMore, currentOffset]);

  // Group journal entries by date (Vietnam timezone)
  const historyData = useMemo(() => {
    if (loadedJournals.length === 0) return [];
    return groupJournalsByDate(loadedJournals);
  }, [loadedJournals]);

  const toggleExpand = useCallback((index) => {
    setExpandedIndex(current => current === index ? null : index);
  }, []);

  // Drag to scroll functionality
  const setupDragScroll = useCallback((element, index) => {
    if (!element) return;
    
    scrollRefs.current[index] = element;
    
    let isDown = false;
    let startY;
    let scrollTop;

    const handleMouseDown = (e) => {
      isDown = true;
      element.style.cursor = 'grabbing';
      startY = e.pageY - element.offsetTop;
      scrollTop = element.scrollTop;
      e.preventDefault();
    };

    const handleMouseLeave = () => {
      isDown = false;
      element.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      element.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - element.offsetTop;
      const walk = (y - startY) * 2; // Scroll speed multiplier
      element.scrollTop = scrollTop - walk;
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
      startY = e.touches[0].pageY - element.offsetTop;
      scrollTop = element.scrollTop;
    };

    const handleTouchMove = (e) => {
      if (!startY) return;
      const y = e.touches[0].pageY - element.offsetTop;
      const walk = (y - startY) * 1.5; // Scroll speed for touch
      element.scrollTop = scrollTop - walk;
    };

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Cleanup function
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Setup drag scroll when items expand
  useEffect(() => {
    const cleanupFunctions = [];
    
    historyData.forEach((_, index) => {
      if (expandedIndex === index && scrollRefs.current[index]) {
        const element = scrollRefs.current[index];
        
        // Check if content is scrollable
        const isScrollable = element.scrollHeight > element.clientHeight;
        element.setAttribute('data-scrollable', isScrollable.toString());
        
        const cleanup = setupDragScroll(element, index);
        if (cleanup) cleanupFunctions.push(cleanup);
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [expandedIndex, historyData, setupDragScroll]);

  // Handle loading state
  if (!data.journal) {
    return (
      <div className="history-list">
        <div className="empty-message history-empty-message">{t('history.loading')}</div>
      </div>
    );
  }

  // Handle empty state
  if (historyData.length === 0) {
    return (
      <div className="history-list">
        <div className="empty-message history-empty-message">{t('history.empty')}</div>
      </div>
    );
  }

  // Prepare display data: translate and drop empty entries
  const displayDays = historyData
    .map(day => {
      const entries = day.entries
        .map(e => ({
          id: e.id,
          time: e.time,
          text: (translateJournalEntry(e.entry, lang, t) || '').trim()
        }))
        .filter(e => !!e.text);
      return { ...day, entries };
    })
    .filter(day => day.entries.length > 0);

  if (displayDays.length === 0) {
    return (
      <div className="history-list">
        <div className="empty-message history-empty-message">{t('history.empty')}</div>
      </div>
    );
  }

  return (
    <div 
      ref={listRef}
      className={`history-list ${displayDays.length > 1 ? 'multiple-items' : 'single-item'}`}
    >
      {displayDays.map((day, index) => {
        // Create unique key using date string
        const dayKey = `day-${day.date.getTime()}-${index}`;
        
        return (
          <div key={dayKey} className={`history-item ${expandedIndex === index ? 'expanded' : ''}`}>
            <div className="history-date-header" onClick={() => toggleExpand(index)}>
              <span className="history-date-text">{formatDate(day.date, lang === 'VI' ? 'vi-VN' : 'en-US', lang === 'VI')}</span>
              <span className="history-arrow">{expandedIndex === index ? '▲' : '▼'}</span>
            </div>
            <div 
              className="history-entries-wrapper"
              ref={(el) => {
                if (el && expandedIndex === index) {
                  setupDragScroll(el, index);
                }
              }}
            >
              {day.entries.map((entry, entryIndex) => (
                <div key={`${entry.id}-${entryIndex}`} className="journal-entry">
                  <div className="journal-time">{formatTime(entry.time, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
                  <div className="journal-text">{entry.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {isLoadingMore && hasMore && displayDays.length > 0 && (
        <div className="history-skeleton-loader">
          <div className="skeleton-line"></div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
