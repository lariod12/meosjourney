import { useEffect } from 'react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, achievementName }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h2>🗑️ Delete Achievement</h2>
        </div>
        
        <div className="delete-modal-content">
          <p className="delete-warning">
            Are you sure you want to delete
          </p>
          <p className="delete-achievement-name">
            "{achievementName}"
          </p>
          <p className="delete-notice">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="delete-modal-actions">
          <button 
            onClick={onCancel}
            className="delete-btn-cancel"
          >
            ✕ Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="delete-btn-confirm"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;