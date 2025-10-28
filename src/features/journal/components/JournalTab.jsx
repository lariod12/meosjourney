import { useMemo } from 'react';
import { useCharacter } from '../../../contexts';
import { formatDate } from '../../../utils/dateUtils';
import { filterTodayItems } from '../../../utils/dateFilter';

const JournalTab = () => {
  const data = useCharacter();
  const today = new Date();

  // Filter journal entries to show only today's entries (Vietnam timezone)
  const todayJournals = useMemo(() => {
    if (!data.journal) return null;
    return filterTodayItems(data.journal);
  }, [data.journal]);

  // Handle loading state
  if (!data.journal) {
    return (
      <>
        <div className="journal-date">{formatDate(today)}</div>
        <div className="journal-content">
          <div className="empty-message">Loading journal entries...</div>
        </div>
      </>
    );
  }

  // Handle empty state - no journal entries for today
  if (todayJournals.length === 0) {
    return (
      <>
        <div className="journal-date">{formatDate(today)}</div>
        <div className="journal-content">
          <div className="empty-message">No journal entries for today.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="journal-date">{formatDate(today)}</div>
      <div className="journal-content">
        {todayJournals.map((entry, index) => (
          <div key={entry.id || index} className="journal-entry">
            <div className="journal-time">{entry.time}</div>
            <div className="journal-text">{entry.entry}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default JournalTab;
