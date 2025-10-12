import { useCharacter } from '../contexts/CharacterContext';

const QuestsTab = () => {
  const data = useCharacter();
  const completed = data.quests.filter(q => q.completed).length;
  const total = data.quests.length;

  return (
    <>
      <div className="quest-progress">
        <span>{completed}/{total}</span> Completed
      </div>
      <div className="quests-list">
        {data.quests.map(quest => (
          <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''}`}>
            <div className="quest-text">{quest.title}</div>
            <div className="quest-xp">+{quest.xp} XP</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default QuestsTab;
