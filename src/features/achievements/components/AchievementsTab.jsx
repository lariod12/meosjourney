import { useState } from 'react';
import { useCharacter } from '../../../contexts';
import AchievementModal from './AchievementModal';

const AchievementsTab = () => {
  const data = useCharacter();
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  console.log('🏆 AchievementsTab - Achievements data:', data.achievements);

  // Handle loading state
  if (!data.achievements) {
    return (
      <div className="achievements-grid">
        <div className="loading-message">Loading achievements...</div>
      </div>
    );
  }

  // Handle empty state
  if (data.achievements.length === 0) {
    return (
      <div className="achievements-grid">
        <div className="empty-message">No achievements found. Create some achievements in the admin panel!</div>
      </div>
    );
  }

  return (
    <>
      <div className="achievements-grid">
        {data.achievements.map(achievement => (
          <div
            key={achievement.id}
            className={`achievement-item ${achievement.completed ? 'completed' : ''}`}
            onClick={() => {
              console.log('🎯 Achievement clicked:', achievement.name);
              setSelectedAchievement(achievement);
            }}
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
