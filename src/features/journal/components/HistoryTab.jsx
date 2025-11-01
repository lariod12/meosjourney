import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useCharacter } from '../../../contexts';
import { formatDate, formatTime } from '../../../utils/dateUtils';
import { groupJournalsByDate, translateJournalEntry } from '../../../utils/journalUtils';
import { useLanguage } from '../../../contexts';

const HistoryTab = () => {
  const data = useCharacter();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const { t, lang } = useLanguage();
  const scrollRefs = useRef({});

  // Group journal entries by date (Vietnam timezone)
  const historyData = useMemo(() => {
    if (!data.journal) return [];
    return groupJournalsByDate(data.journal);
  }, [data.journal]);

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
    <div className={`history-list ${displayDays.length > 1 ? 'multiple-items' : 'single-item'}`}>
      {displayDays.map((day, index) => (
        <div key={index} className={`history-item ${expandedIndex === index ? 'expanded' : ''}`}>
          <div className="history-date-header" onClick={() => toggleExpand(index)}>
            <span className="history-date-text">{formatDate(day.date, lang === 'VI' ? 'vi-VN' : 'en-US')}</span>
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
              <div key={entry.id || entryIndex} className="journal-entry">
                <div className="journal-time">{formatTime(entry.time, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
                <div className="journal-text">{entry.text}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTab;
