import { useState } from 'react';
import { useCharacter } from '../../../contexts';
import AchievementModal from './AchievementModal';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';

const AchievementsTab = () => {
  const data = useCharacter();
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  console.log('🎮 AchievementsTab - Total achievements:', data.achievements?.length || 0);

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
        {data.achievements.map(achievement => {
          // Check completion status from completedAt field
          const isCompleted = achievement.completedAt !== null && achievement.completedAt !== undefined;
          
          return (
            <div
              key={achievement.id}
              className={`achievement-item ${isCompleted ? 'completed' : ''}`}
              onClick={() => {
                console.log('🎯 Achievement clicked:', achievement.name);
                setSelectedAchievement(achievement);
              }}
            >
              {isCompleted && <div className="achievement-check">✓</div>}
              <div className="achievement-icon">
                <IconRenderer iconName={achievement.icon} size={32} />
              </div>
              <div className="achievement-name">{achievement.name}</div>
            </div>
          );
        })}
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
