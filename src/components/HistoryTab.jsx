import { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { formatDate } from '../utils/dateUtils';

const HistoryTab = () => {
  const data = useCharacter();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="history-list">
      {data.history.map((day, index) => (
        <div key={index} className={`history-item ${expandedIndex === index ? 'expanded' : ''}`}>
          <div className="history-date-header" onClick={() => toggleExpand(index)}>
            <span className="history-date-text">{formatDate(day.date)}</span>
            <span className="history-arrow">{expandedIndex === index ? '▲' : '▼'}</span>
          </div>
          <div className="history-entries-wrapper">
            {day.entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="journal-entry">
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
