import { useState, useMemo } from 'react';
import { useCharacter } from '../../../contexts';
import QuestDetailModal from '../../../components/QuestDetailModal/QuestDetailModal';
import { filterTodayItems } from '../../../utils/dateFilter';

const QuestsTab = () => {
  const data = useCharacter();
  const [selectedQuest, setSelectedQuest] = useState(null);

  // Filter quests to show only today's quests (Vietnam timezone)
  const todayQuests = useMemo(() => {
    if (!data.quests) return null;
    return filterTodayItems(data.quests);
  }, [data.quests]);

  // Handle loading state
  if (!data.quests) {
    return (
      <>
        <div className="quest-progress">
          <span>0/0</span> Completed
        </div>
        <div className="quests-list">
          <div className="loading-message">Loading quests...</div>
        </div>
      </>
    );
  }

  // Handle empty state - no quests for today
  if (todayQuests.length === 0) {
    return (
      <>
        <div className="quest-progress">
          <span>0/0</span> Completed
        </div>
        <div className="quests-list">
          <div className="empty-message">No quests for today.</div>
        </div>
      </>
    );
  }

  const completed = todayQuests.filter(q => q.completedAt !== null).length;
  const total = todayQuests.length;

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
        {todayQuests.map(quest => {
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
