import { useEffect } from 'react';
import { useLanguage } from '../../contexts';
import './QuestDetailModal.css';

const QuestDetailModal = ({ quest, onClose }) => {
  if (!quest) return null;

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const { t } = useLanguage();
  
  const isCompleted = quest.completedAt !== null;
  const modalTitle = isCompleted ? t('modal.quest.title_completed') : t('modal.quest.title');

  return (
    <div className="quest-detail-overlay" onClick={handleOverlayClick}>
      <div className="quest-detail-modal">
        <div className="quest-detail-header">
          <h2>⚔️ {modalTitle}</h2>
          <button 
            className="quest-detail-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="quest-detail-content">
          {/* Quest Title */}
          <label className="quest-detail-label">{t('modal.quest.name')}</label>
          <div className="quest-detail-value quest-title">
            {quest.name}
          </div>

          {/* Quest Description */}
          {quest.desc && (
            <>
              <label className="quest-detail-label">{t('modal.quest.description')}</label>
              <div className="quest-detail-value quest-description">
                {quest.desc}
              </div>
            </>
          )}

          {/* XP Reward */}
          <label className="quest-detail-label">{t('modal.quest.xp')}</label>
          <div className="quest-detail-value quest-xp-value">
            <span className="xp-badge">+{quest.xp} XP</span>
          </div>
        </div>

        <div className="quest-detail-footer">
          <button 
            className="btn-close-modal"
            onClick={onClose}
          >
            {t('modal.common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailModal;