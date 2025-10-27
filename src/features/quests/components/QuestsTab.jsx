import { useState } from 'react';
import { useCharacter } from '../../../contexts';
import QuestDetailModal from '../../../components/QuestDetailModal/QuestDetailModal';

const QuestsTab = () => {
  const data = useCharacter();
  const [selectedQuest, setSelectedQuest] = useState(null);

  console.log('🎯 QuestsTab - Total quests:', data.quests?.length || 0);

  // Handle loading state
  if (!data.quests) {
    return (
      <div className="quests-list">
        <div className="loading-message">Loading quests...</div>
      </div>
    );
  }

  // Handle empty state
  if (data.quests.length === 0) {
    return (
      <div className="quests-list">
        <div className="empty-message">No quests found. Create some quests in the admin panel!</div>
      </div>
    );
  }

  const completed = data.quests.filter(q => q.completedAt !== null).length;
  const total = data.quests.length;

  const handleQuestClick = (quest) => {
    console.log('🎯 Quest clicked:', quest.name);
    setSelectedQuest(quest);
  };

  const handleCloseModal = () => {
    console.log('❌ Closing quest detail modal');
    setSelectedQuest(null);
  };

  return (
    <>
      <div className="quest-progress">
        <span>{completed}/{total}</span> Completed
      </div>
      <div className="quests-list">
        {data.quests.map(quest => {
          const isCompleted = quest.completedAt !== null;
          return (
            <div 
              key={quest.id} 
              className={`quest-item ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleQuestClick(quest)}
              style={{ cursor: 'pointer' }}
            >
              <div className="quest-text">{quest.name}</div>
              <div className="quest-xp">+{quest.xp} XP</div>
            </div>
          );
        })}
      </div>

      {selectedQuest && (
        <QuestDetailModal 
          quest={selectedQuest}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default QuestsTab;
