import { useEffect } from 'react';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import { useLanguage } from '../../../contexts';
import { formatDate } from '../../../utils/dateUtils';

const AchievementModal = ({ achievement, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const { t, lang } = useLanguage();
  const isCompleted = achievement.completedAt !== null;

  return (
    <div className="achievement-modal active" onClick={handleBackdropClick}>
      <div className="achievement-modal-content">
        <div className="achievement-modal-close" onClick={onClose}>✕</div>
        {isCompleted && (
          <div className="achievement-modal-status completed">{t('modal.achievement.completed')}</div>
        )}
        <div className="achievement-modal-icon">
          <IconRenderer iconName={achievement.icon} size={48} />
        </div>
        <div className="achievement-modal-title">{achievement.name}</div>
        <div className="achievement-modal-description">
          {achievement.description || achievement.desc}
          {achievement.dueDate && (
            <div className="achievement-modal-due-date">
              {t('modal.achievement.due_date')} {(() => {
                try {
                  // Handle different date formats
                  let date;
                  if (typeof achievement.dueDate === 'string') {
                    date = new Date(achievement.dueDate);
                  } else if (achievement.dueDate.toDate) {
                    // Firestore Timestamp
                    date = achievement.dueDate.toDate();
                  } else {
                    date = new Date(achievement.dueDate);
                  }
                  
                  // Check if date is valid
                  if (isNaN(date.getTime())) {
                    return achievement.dueDate; // Return original if can't parse
                  }

                  return formatDate(date, lang === 'VI' ? 'vi-VN' : 'en-US');
                } catch (error) {
                  console.error('Error parsing due date:', error);
                  return achievement.dueDate; // Return original on error
                }
              })()}
            </div>
          )}
        </div>

        <div className="achievement-modal-rewards-box">
          <div className="rewards-box-title">{t('modal.achievement.rewards')}</div>
          <div className="rewards-box-list">
            {achievement.specialReward ? (
              <>
                <div className="reward-special">{achievement.specialReward}</div>
                <div className="reward-exp">+{achievement.exp || achievement.xp} EXP</div>
              </>
            ) : (
              <div className="reward-exp-only">+{achievement.exp || achievement.xp} EXP</div>
            )}
          </div>
        </div>

        {/* User Confirmation Description if available - placed at bottom for consistency */}
        {isCompleted && achievement.confirmation?.desc && (
          <div className="achievement-modal-user-desc">
            <div className="user-desc-title">{t('modal.common.user_desc')}</div>
            <div className="user-desc-content">{achievement.confirmation.desc}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementModal;
