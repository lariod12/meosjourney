import { useState, useMemo } from 'react';
import { useCharacter } from '../../../contexts';
import QuestDetailModal from '../../../components/QuestDetailModal/QuestDetailModal';
import { filterTodayItems } from '../../../utils/dateFilter';
import { useLanguage } from '../../../contexts';

const QuestsTab = () => {
  const data = useCharacter();
  const [selectedQuest, setSelectedQuest] = useState(null);
  const { t, getLocalized } = useLanguage();

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
          <span>0/0</span> {t('quests.completed')}
        </div>
        <div className="quests-list">
          <div className="loading-message">{t('quests.loading')}</div>
        </div>
      </>
    );
  }

  // Handle empty state - no quests for today
  if (todayQuests.length === 0) {
    return (
      <>
        <div className="quest-progress">
          <span>0/0</span> {t('quests.completed')}
        </div>
        <div className="quests-list">
          <div className="empty-message">{t('quests.empty_today')}</div>
        </div>
      </>
    );
  }

  const completed = todayQuests.filter(q => q.completedAt !== null).length;
  const total = todayQuests.length;

  const handleQuestClick = (quest) => {
    setSelectedQuest(quest);
  };

  const handleCloseModal = () => {
    setSelectedQuest(null);
  };

  return (
    <>
      <div className="quest-progress">
        <span>{completed}/{total}</span> {t('quests.completed')}
      </div>
      <div className="quests-list">
        {todayQuests.map(quest => {
          const isCompleted = quest.completedAt !== null;
          const questName = getLocalized(quest.nameTranslations, quest.name);
          return (
            <div
              key={quest.id}
              className={`quest-item ${isCompleted ? 'completed' : ''}`}
              onClick={() => handleQuestClick(quest)}
              style={{ cursor: 'pointer' }}
            >
              <div className="quest-text">{questName}</div>
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
