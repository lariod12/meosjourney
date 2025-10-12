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
        <div className="achievement-modal-description">{achievement.description}</div>
        <div className="achievement-modal-rewards-box">
          <div className="rewards-box-title">REWARDS</div>
          <div className="rewards-box-list">
            {achievement.specialReward ? (
              <>
                <div className="reward-special">{achievement.specialReward}</div>
                <div className="reward-exp">+{achievement.exp} EXP</div>
              </>
            ) : (
              <div className="reward-exp-only">+{achievement.exp} EXP</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementModal;
