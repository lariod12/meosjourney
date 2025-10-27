import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "info" // "info", "success", "warning", "error"
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
    console.log('✅ User confirmed action');
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    console.log('❌ User cancelled action');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="confirm-modal-overlay">
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