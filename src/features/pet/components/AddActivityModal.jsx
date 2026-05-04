import { useState, useEffect } from 'react';
import IconPicker from '../../../components/IconPicker/IconPicker';
import '../styles/add-activity-modal.css';

const AddActivityModal = ({ isOpen, onClose, onSave, isLoading = false }) => {
  const [activityTitle, setActivityTitle] = useState('');
  const [activityIcon, setActivityIcon] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActivityTitle('');
      setActivityIcon('');
    }
  }, [isOpen]);

  // Check if form is valid (title and icon required)
  const isFormValid = activityTitle.trim() && activityIcon.trim();

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSave = (setAsCurrent) => {
    if (!isFormValid || isLoading) {
      return;
    }

    onSave({
      name: activityTitle.trim(),
      icon: activityIcon.trim()
    }, setAsCurrent);

    // Reset form
    setActivityTitle('');
    setActivityIcon('');
  };

  if (!isOpen) return null;

  return (
    <div className="add-activity-modal-overlay" onClick={handleClose}>
      <div className="add-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-activity-modal__header">
          <h2 className="add-activity-modal__title">Add New Activity</h2>
          <button
            type="button"
            className="add-activity-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="add-activity-modal__body">
          <div className="add-activity-modal__field">
            <label htmlFor="activity-title" className="add-activity-modal__label">
              Title
            </label>
            <input
              id="activity-title"
              type="text"
              className="add-activity-modal__input"
              placeholder="Enter activity name..."
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="add-activity-modal__field">
            <label htmlFor="activity-icon" className="add-activity-modal__label">
              Icon
            </label>
            <IconPicker
              value={activityIcon}
              onChange={(e) => setActivityIcon(e.target.value)}
              placeholder="Choose an icon..."
              disabled={isLoading}
            />
            {!activityIcon.trim() && activityTitle.trim() && (
              <p className="add-activity-modal__error">
                <strong>(Please select an icon for the activity.)</strong>
              </p>
            )}
          </div>
        </div>

        <div className="add-activity-modal__footer">
          <button
            type="button"
            className="add-activity-modal__button add-activity-modal__button--cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="add-activity-modal__button add-activity-modal__button--save-only"
            onClick={() => handleSave(false)}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <span className="add-activity-modal__loading">
                <span className="add-activity-modal__spinner"></span>
                Saving...
              </span>
            ) : (
              'Save Only'
            )}
          </button>
          <button
            type="button"
            className="add-activity-modal__button add-activity-modal__button--save"
            onClick={() => handleSave(true)}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <span className="add-activity-modal__loading">
                <span className="add-activity-modal__spinner"></span>
                Saving...
              </span>
            ) : (
              'Save & Select'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddActivityModal;