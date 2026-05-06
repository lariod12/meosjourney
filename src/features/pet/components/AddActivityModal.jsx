import { useState, useEffect } from 'react';
import IconPicker from '../../../components/IconPicker/IconPicker';
import '../styles/add-activity-modal.css';

const AddActivityModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  title = 'Add New Activity',
  itemLabel = 'Title',
  namePlaceholder = 'Enter activity name...',
  saveOnlyLabel = 'Save Only',
  saveAndSelectLabel = 'Save & Select',
  saveLabel = 'Save',
  showSaveAndSelect = true,
  showIconPicker = true,
  requireIcon = true
}) => {
  const [itemTitle, setItemTitle] = useState('');
  const [itemIcon, setItemIcon] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setItemTitle('');
      setItemIcon('');
    }
  }, [isOpen]);

  // Check required fields based on modal configuration.
  const isFormValid = itemTitle.trim() && (!requireIcon || itemIcon.trim());

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSave = (setAsCurrent) => {
    if (!isFormValid || isLoading) {
      return;
    }

    onSave({
      name: itemTitle.trim(),
      icon: itemIcon.trim()
    }, setAsCurrent);

    // Reset form
    setItemTitle('');
    setItemIcon('');
  };

  if (!isOpen) return null;

  return (
    <div className="add-activity-modal-overlay" onClick={handleClose}>
      <div className="add-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-activity-modal__header">
          <h2 className="add-activity-modal__title">{title}</h2>
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
              {itemLabel}
            </label>
            <input
              id="activity-title"
              type="text"
              className="add-activity-modal__input"
              placeholder={namePlaceholder}
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {showIconPicker && (
            <div className="add-activity-modal__field">
              <label htmlFor="activity-icon" className="add-activity-modal__label">
                Icon
              </label>
              <IconPicker
                value={itemIcon}
                onChange={(e) => setItemIcon(e.target.value)}
                placeholder="Choose an icon..."
                disabled={isLoading}
              />
              {requireIcon && !itemIcon.trim() && itemTitle.trim() && (
                <p className="add-activity-modal__error">
                  <strong>(Please select an icon.)</strong>
                </p>
              )}
            </div>
          )}
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
              showSaveAndSelect ? saveOnlyLabel : saveLabel
            )}
          </button>
          {showSaveAndSelect && (
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
                saveAndSelectLabel
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddActivityModal;
