import { useEffect } from 'react';

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

  return (
    <div className="achievement-modal active" onClick={handleBackdropClick}>
      <div className="achievement-modal-content">
        <div className="achievement-modal-close" onClick={onClose}>✕</div>
        {achievement.completed && (
          <div className="achievement-modal-status completed">✓ COMPLETED</div>
        )}
        <div className="achievement-modal-icon">{achievement.icon}</div>
        <div className="achievement-modal-title">{achievement.name}</div>
        <div className="achievement-modal-description">
          {achievement.description || achievement.desc}
          {achievement.dueDate && (
            <div className="achievement-modal-due-date">
              Due Date: {(() => {
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
                  
                  return date.toLocaleDateString('vi-VN');
                } catch (error) {
                  console.error('Error parsing due date:', error);
                  return achievement.dueDate; // Return original on error
                }
              })()}
            </div>
          )}
        </div>
        <div className="achievement-modal-rewards-box">
          <div className="rewards-box-title">REWARDS</div>
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
      </div>
    </div>
  );
};

export default AchievementModal;
