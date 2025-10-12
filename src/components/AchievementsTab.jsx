import { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import AchievementModal from './AchievementModal';

const AchievementsTab = () => {
  const data = useCharacter();
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  return (
    <>
      <div className="achievements-grid">
        {data.achievements.map(achievement => (
          <div
            key={achievement.id}
            className={`achievement-item ${achievement.completed ? 'completed' : ''}`}
            onClick={() => setSelectedAchievement(achievement)}
          >
            {achievement.completed && <div className="achievement-check">✓</div>}
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-name">{achievement.name}</div>
          </div>
        ))}
      </div>
      {selectedAchievement && (
        <AchievementModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </>
  );
};

export default AchievementsTab;
