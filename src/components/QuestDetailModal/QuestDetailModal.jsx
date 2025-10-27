import { useEffect } from 'react';
import './QuestDetailModal.css';

const QuestDetailModal = ({ quest, onClose }) => {
  if (!quest) return null;

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not completed';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const isCompleted = quest.completedAt !== null;

  return (
    <div className="quest-detail-overlay" onClick={handleOverlayClick}>
      <div className="quest-detail-modal">
        <div className="quest-detail-header">
          <h2>⚔️ Quest Details</h2>
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
          <div className="quest-detail-section">
            <label className="quest-detail-label">Quest Name</label>
            <div className="quest-detail-value quest-title">
              {quest.name}
            </div>
          </div>

          {/* Quest Description */}
          {quest.desc && (
            <div className="quest-detail-section">
              <label className="quest-detail-label">Description</label>
              <div className="quest-detail-value quest-description">
                {quest.desc}
              </div>
            </div>
          )}

          {/* XP Reward */}
          <div className="quest-detail-section">
            <label className="quest-detail-label">XP Reward</label>
            <div className="quest-detail-value quest-xp-value">
              <span className="xp-badge">+{quest.xp} XP</span>
            </div>
          </div>

          {/* Created Date */}
          <div className="quest-detail-section">
            <label className="quest-detail-label">Created At</label>
            <div className="quest-detail-value quest-date">
              {formatDate(quest.createdAt)}
            </div>
          </div>

          {/* Completed Date */}
          {isCompleted && (
            <div className="quest-detail-section">
              <label className="quest-detail-label">Completed At</label>
              <div className="quest-detail-value quest-date completed-date">
                {formatDate(quest.completedAt)}
              </div>
            </div>
          )}
        </div>

        <div className="quest-detail-footer">
          <button 
            className="btn-close-modal"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailModal;
