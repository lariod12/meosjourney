import { useState, useEffect } from 'react';
import IconPicker from '../../../components/IconPicker/IconPicker';
import '../styles/update-icon-modal.css';

const UpdateIconModal = ({ isOpen, onClose, onSave, activity, isLoading = false, itemLabel = 'Activity' }) => {
  const [selectedIcon, setSelectedIcon] = useState('');

  useEffect(() => {
    if (isOpen && activity) {
      setSelectedIcon(activity.icon || '');
    }
  }, [isOpen, activity]);

  const handleSave = () => {
    if (!selectedIcon.trim() || isLoading) return;
    onSave({
      ...activity,
      icon: selectedIcon.trim()
    });
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!isOpen || !activity) return null;

  const hasIconChanged = selectedIcon.trim() !== (activity.icon || '');
  const isValid = selectedIcon.trim() && hasIconChanged;

  return (
    <div className="update-icon-modal-overlay" onClick={handleClose}>
      <div className="update-icon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="update-icon-modal__header">
          <h2 className="update-icon-modal__title">Update Icon</h2>
          <button
            type="button"
            className="update-icon-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="update-icon-modal__body">
          <p className="update-icon-modal__activity-name">
            {itemLabel}: <strong>{activity.name}</strong>
          </p>

          <div className="update-icon-modal__field">
            <label className="update-icon-modal__label">New Icon</label>
            <IconPicker
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              placeholder="Choose a new icon..."
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="update-icon-modal__footer">
          <button
            type="button"
            className="update-icon-modal__button update-icon-modal__button--cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="update-icon-modal__button update-icon-modal__button--save"
            onClick={handleSave}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Icon'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateIconModal;
