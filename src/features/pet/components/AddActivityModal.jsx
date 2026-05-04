import { useState, useEffect, useRef, useMemo } from 'react';
import IconPicker from '../../../components/IconPicker/IconPicker';
import '../styles/add-activity-modal.css';

const AddActivityModal = ({ isOpen, onClose, onSave, isLoading = false, existingActivities = [] }) => {
  const [activityTitle, setActivityTitle] = useState('');
  const [activityIcon, setActivityIcon] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const modalBodyRef = useRef(null);

  // Check if current title matches an existing activity
  const existingActivity = useMemo(() => {
    if (!activityTitle.trim()) return null;
    const titleLower = activityTitle.toLowerCase();
    return existingActivities.find(
      activity => activity.name.toLowerCase() === titleLower
    );
  }, [activityTitle, existingActivities]);

  const isExistingActivity = !!existingActivity;

  // Auto-fill icon when existing activity is detected
  useEffect(() => {
    if (existingActivity && !activityIcon) {
      setActivityIcon(existingActivity.icon || '');
    }
  }, [existingActivity]);

  // Check if icon has been changed from original
  const iconChanged = useMemo(() => {
    if (!existingActivity) return false;
    return activityIcon !== (existingActivity.icon || '');
  }, [existingActivity, activityIcon]);

  useEffect(() => {
    if (activityTitle.trim().length > 0) {
      const filtered = existingActivities.filter(activity => {
        const titleLower = activityTitle.toLowerCase();
        const activityNameLower = activity.name.toLowerCase();

        // Don't show suggestion if title exactly matches an activity
        if (titleLower === activityNameLower) {
          return false;
        }

        // Show suggestion if activity name contains the input
        return activityNameLower.includes(titleLower);
      });
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [activityTitle, existingActivities]);

  // Auto-scroll to suggestions when they appear
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current && modalBodyRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        const suggestionsElement = suggestionsRef.current;
        const modalBodyElement = modalBodyRef.current;

        if (suggestionsElement && modalBodyElement) {
          const suggestionsRect = suggestionsElement.getBoundingClientRect();
          const modalBodyRect = modalBodyElement.getBoundingClientRect();

          // Check if suggestions are below the visible area
          if (suggestionsRect.bottom > modalBodyRect.bottom) {
            // Calculate scroll position to show suggestions
            const scrollOffset = suggestionsRect.bottom - modalBodyRect.bottom + 20; // 20px padding
            modalBodyElement.scrollBy({
              top: scrollOffset,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
    }
  }, [showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setActivityTitle(suggestion.name);
    setActivityIcon(suggestion.icon || '');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSave = (setAsCurrent) => {
    if (!activityTitle.trim() || isLoading) {
      return;
    }

    // For existing activities without icon changes, preserve the original icon
    let iconToSave = activityIcon.trim();
    if (isExistingActivity && !iconChanged && existingActivity) {
      iconToSave = existingActivity.icon || '';
    }

    onSave({
      name: activityTitle.trim(),
      icon: iconToSave
    }, setAsCurrent);

    // Reset form
    setActivityTitle('');
    setActivityIcon('');
    setShowSuggestions(false);
  };

    // Check if form is valid (title and icon required)
  const isFormValid = activityTitle.trim() && (
    activityIcon.trim() || (isExistingActivity && existingActivity?.icon)
  );

  const handleClose = () => {
    if (isLoading) return;

    // Reset form
    setActivityTitle('');
    setActivityIcon('');
    setShowSuggestions(false);
    onClose();
  };

  const handleCancel = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-activity-modal-overlay" onClick={handleClose}>
      <div className="add-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-activity-modal__header">
          <h2 className="add-activity-modal__title">
            {isExistingActivity ? 'Select Activity' : 'Add New Activity'}
          </h2>
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

        <div ref={modalBodyRef} className="add-activity-modal__body">
          <div className="add-activity-modal__field">
            <label htmlFor="activity-icon" className="add-activity-modal__label">
              Icon {isExistingActivity && <span className="add-activity-modal__label-hint">(editable)</span>}
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
            )}</div>

          <div className="add-activity-modal__field add-activity-modal__field--relative">
            <label htmlFor="activity-title" className="add-activity-modal__label">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              id="activity-title"
              className="add-activity-modal__input"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              placeholder="e.g., Playing games, Reading books..."
              autoComplete="off"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.isComposing && !isLoading) {
                  e.preventDefault();
                  handleSave(true);
                }
              }}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="add-activity-modal__suggestions">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.name}-${index}`}
                    type="button"
                    className="add-activity-modal__suggestion"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="add-activity-modal__suggestion-name">{suggestion.name}</span>
                    {suggestion.icon && (
                      <span className="add-activity-modal__suggestion-icon">{suggestion.icon}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="add-activity-modal__footer">
          <button
            type="button"
            className="add-activity-modal__button add-activity-modal__button--cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          {!isExistingActivity && (
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
          )}
          {isExistingActivity && iconChanged && (
            <button
              type="button"
              className="add-activity-modal__button add-activity-modal__button--update"
              onClick={() => handleSave(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="add-activity-modal__loading">
                  <span className="add-activity-modal__spinner"></span>
                  Updating...
                </span>
              ) : (
                'Update Icon'
              )}
            </button>
          )}
          <button
            type="button"
            className="add-activity-modal__button add-activity-modal__button--save"
            onClick={() => handleSave(true)}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <span className="add-activity-modal__loading">
                <span className="add-activity-modal__spinner"></span>
                {isExistingActivity ? 'Selecting...' : 'Saving...'}
              </span>
            ) : (
              isExistingActivity ? 'Select' : 'Save & Select'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddActivityModal;
