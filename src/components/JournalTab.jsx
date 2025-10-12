import { useCharacter } from '../contexts/CharacterContext';
import { formatDate } from '../utils/dateUtils';

const JournalTab = () => {
  const data = useCharacter();
  const today = new Date();

  return (
    <>
      <div className="journal-date">{formatDate(today)}</div>
      <div className="journal-content">
        {data.journal.map((entry, index) => (
          <div key={index} className="journal-entry">
            <div className="journal-time">{entry.time}</div>
            <div className="journal-text">{entry.entry}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default JournalTab;
