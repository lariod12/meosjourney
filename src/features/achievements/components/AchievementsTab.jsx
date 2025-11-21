import { useState } from 'react';
import { useCharacter } from '../../../contexts';
import AchievementModal from './AchievementModal';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import { useLanguage } from '../../../contexts';

export default function AchievementsTab() {
  const data = useCharacter();
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const { t, getLocalized } = useLanguage();

  // Handle loading state
  if (!data.achievements) {
    return (
      <div className="achievements-grid">
        <div className="loading-message">{t('achievements.loading')}</div>
      </div>
    );
  }

  // Handle empty state
  if (data.achievements.length === 0) {
    return (
      <div className="achievements-grid">
        <div className="empty-message">{t('achievements.empty')}</div>
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
                setSelectedAchievement(achievement);
              }}
            >
              {isCompleted && <div className="achievement-check">✓</div>}
              <div className="achievement-icon">
                <IconRenderer iconName={achievement.icon} size={32} />
              </div>
              <div className="achievement-name">
                {getLocalized(achievement.nameTranslations, achievement.name)}
              </div>
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
}
