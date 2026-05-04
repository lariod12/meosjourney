import '../styles/confirm-activity-modal.css';

import { useState, useEffect, useMemo } from 'react';
import IconPicker from '../../../components/IconPicker/IconPicker';

const ConfirmActivityModal = ({ isOpen, onClose, onConfirm, activityName, activityIcon = '', isLoading = false }) => {
  const [selectedIcon, setSelectedIcon] = useState('');

  // Reset icon when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIcon(activityIcon || '');
    }
  }, [isOpen, activityIcon]);

  // Check if icon has changed
  const iconChanged = useMemo(() => {
    return selectedIcon !== (activityIcon || '');
  }, [selectedIcon, activityIcon]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm(selectedIcon);
  };

  const handleUpdateIcon = () => {
    if (isLoading) return;
    onConfirm(selectedIcon, true); // true = update icon only, don't set as current
  };

  return (
    <div className="confirm-activity-modal-overlay" onClick={handleClose}>
      <div className="confirm-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-activity-modal__header">
          <h2 className="confirm-activity-modal__title">Set Current Activity</h2>
          <button
            type="button"
            className="confirm-activity-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="confirm-activity-modal__body">
          <div className="confirm-activity-modal__field">
            <label htmlFor="confirm-activity-icon" className="confirm-activity-modal__label">
              Icon
            </label>
            <IconPicker
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              placeholder="Choose an icon..."
              disabled={isLoading}
            />
          
            {!selectedIcon.trim() && (
              <p className="confirm-activity-modal__error">
                <strong>(Please select an icon for the activity.)</strong>
              </p>
            )}</div>

          <p className="confirm-activity-modal__message">
            Do you want to set <strong>"{activityName}"</strong> as your current activity?
          </p>
          <p className="confirm-activity-modal__note">
            This will be displayed on the home page.
          </p>
        </div>

        <div className="confirm-activity-modal__footer">
          <button
            type="button"
            className="confirm-activity-modal__button confirm-activity-modal__button--cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          {iconChanged && (
            <button
              type="button"
              className="confirm-activity-modal__button confirm-activity-modal__button--update"
              onClick={handleUpdateIcon}
              disabled={isLoading || !selectedIcon.trim()}
            >
              {isLoading ? (
                <span className="confirm-activity-modal__loading">
                  <span className="confirm-activity-modal__spinner"></span>
                  Updating...
                </span>
              ) : (
                'Update Icon'
              )}
            </button>
          )}
          <button
            type="button"
            className="confirm-activity-modal__button confirm-activity-modal__button--confirm"
            onClick={handleConfirm}
            disabled={isLoading || !selectedIcon.trim()}
          >
            {isLoading ? (
              <span className="confirm-activity-modal__loading">
                <span className="confirm-activity-modal__spinner"></span>
                Setting...
              </span>
            ) : (
              'Yes, Set It'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActivityModal;
