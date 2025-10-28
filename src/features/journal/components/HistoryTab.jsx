import { useState, useMemo, useCallback } from 'react';
import { useCharacter } from '../../../contexts';
import { formatDate } from '../../../utils/dateUtils';
import { groupJournalsByDate } from '../../../utils/journalUtils';

const HistoryTab = () => {
  const data = useCharacter();
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Group journal entries by date (Vietnam timezone)
  const historyData = useMemo(() => {
    if (!data.journal) return [];
    return groupJournalsByDate(data.journal);
  }, [data.journal]);

  const toggleExpand = useCallback((index) => {
    setExpandedIndex(current => current === index ? null : index);
  }, []);

  // Handle loading state
  if (!data.journal) {
    return (
      <div className="history-list">
        <div className="history-empty-message">Loading journal history...</div>
      </div>
    );
  }

  // Handle empty state
  if (historyData.length === 0) {
    return (
      <div className="history-list">
        <div className="history-empty-message">No journal entries found.</div>
      </div>
    );
  }

  return (
    <div className="history-list">
      {historyData.map((day, index) => (
        <div key={index} className={`history-item ${expandedIndex === index ? 'expanded' : ''}`}>
          <div className="history-date-header" onClick={() => toggleExpand(index)}>
            <span className="history-date-text">{formatDate(day.date)}</span>
            <span className="history-arrow">{expandedIndex === index ? '▲' : '▼'}</span>
          </div>
          <div className="history-entries-wrapper">
            {day.entries.map((entry, entryIndex) => (
              <div key={entry.id || entryIndex} className="journal-entry">
                <div className="journal-time">{entry.time}</div>
                <div className="journal-text">{entry.entry}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTab;
