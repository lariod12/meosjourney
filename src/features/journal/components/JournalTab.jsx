import { useMemo } from 'react';
import { useCharacter } from '../../../contexts';
import { formatDate, formatTime } from '../../../utils/dateUtils';
import { filterTodayItems } from '../../../utils/dateFilter';
import { useLanguage } from '../../../contexts';

const JournalTab = () => {
  const data = useCharacter();
  const today = new Date();
  const { t, lang } = useLanguage();

  // Filter journal entries to show only today's entries (Vietnam timezone)
  const todayJournals = useMemo(() => {
    if (!data.journal) return null;
    return filterTodayItems(data.journal);
  }, [data.journal]);

  // Handle loading state
  if (!data.journal) {
    return (
      <>
        <div className="journal-date">{formatDate(today, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
        <div className="journal-content">
          <div className="empty-message">{t('journal.loading')}</div>
        </div>
      </>
    );
  }

  // Handle empty state - no journal entries for today
  if (todayJournals.length === 0) {
    return (
      <>
        <div className="journal-date">{formatDate(today, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
        <div className="journal-content">
          <div className="empty-message">{t('journal.empty_today')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="journal-date">{formatDate(today, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
      <div className="journal-content">
        {todayJournals.map((entry, index) => (
          <div key={entry.id || index} className="journal-entry">
            <div className="journal-time">{formatTime(entry.time, lang === 'VI' ? 'vi-VN' : 'en-US')}</div>
            <div className="journal-text">{entry.entry}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default JournalTab;
