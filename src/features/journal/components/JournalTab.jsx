import { useCharacter } from '../../../contexts';
import { formatDate } from '../../../utils/dateUtils';

const JournalTab = () => {
  const data = useCharacter();
  const today = new Date();

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

  // Handle empty state
  if (data.journal.length === 0) {
    return (
      <>
        <div className="journal-date">{formatDate(today)}</div>
        <div className="journal-content">
          <div className="empty-message">No journal entries yet.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="journal-date">{formatDate(today)}</div>
      <div className="journal-content">
        {data.journal.map((entry, index) => (
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
