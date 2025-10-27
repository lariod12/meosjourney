import { useCharacter } from '../../../contexts';

const QuestsTab = () => {
  const data = useCharacter();
  const completed = data.quests.filter(q => q.completedAt !== null).length;
  const total = data.quests.length;

  return (
    <>
      <div className="quest-progress">
        <span>{completed}/{total}</span> Completed
      </div>
      <div className="quests-list">
        {data.quests.map(quest => {
          const isCompleted = quest.completedAt !== null;
          return (
            <div key={quest.id} className={`quest-item ${isCompleted ? 'completed' : ''}`}>
              <div className="quest-text">{quest.name}</div>
              <div className="quest-xp">+{quest.xp} XP</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default QuestsTab;
