import { useEffect } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "info", // "info", "success", "warning", "error"
  canClose = true // Can close by clicking overlay or ESC
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success": return "✓";
      case "warning": return "⚠";
      case "error": return "✕";
      default: return "ℹ";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (import.meta.env.MODE !== 'production') {
      console.log('❌ User cancelled action');
    }
    if (onCancel) {
      onCancel();
    }
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking on overlay (not modal content) and canClose is true
    if (e.target === e.currentTarget && canClose && onCancel) {
      handleCancel();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && canClose && onCancel) {
        if (import.meta.env.MODE !== 'production') {
          console.log('❌ User pressed ESC');
        }
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, canClose, onCancel]);

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className={`confirm-modal confirm-modal-${type}`}>
        <div className="confirm-modal-header">
          <h2>
            <span className="confirm-icon">{getIcon()}</span>
            {title}
          </h2>
        </div>

        <div className="confirm-modal-content">
          <p className="confirm-message">{message}</p>
        </div>

        <div className={`confirm-modal-actions ${!cancelText && !confirmText ? 'no-buttons' : !cancelText ? 'single-button' : ''}`}>
          {cancelText && (
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          {confirmText && (
            <button
              type="button"
              className="confirm-btn-confirm"
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;