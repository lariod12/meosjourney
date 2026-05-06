import { useState, useEffect } from 'react';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import '../styles/choose-activity-modal.css';

const ChooseActivityModal = ({
  isOpen,
  onClose,
  onConfirm,
  onUpdate,
  existingActivities,
  isLoading = false,
  title = 'Choose Activity',
  searchPlaceholder = 'Search activities...',
  emptyText = 'No activities found',
  confirmLabel = 'Confirm'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [expandedActivity, setExpandedActivity] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFilteredActivities(existingActivities || []);
      setExpandedActivity(null);
    }
  }, [isOpen, existingActivities]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    const query = value.trim().toLowerCase();
    
    if (!query) {
      setFilteredActivities(existingActivities || []);
      return;
    }

    const filtered = (existingActivities || []).filter(activity =>
      activity.name.toLowerCase().includes(query)
    );
    setFilteredActivities(filtered);
  };

  const handleActivityClick = (activity) => {
    if (isLoading) return;
    // Toggle expand
    if (expandedActivity?.name === activity.name) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activity);
    }
  };

  const handleConfirm = (activity) => {
    if (isLoading) return;
    onConfirm(activity);
  };

  const handleUpdate = (activity) => {
    if (isLoading) return;
    onUpdate(activity);
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="choose-activity-modal-overlay" onClick={handleClose}>
      <div className="choose-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="choose-activity-modal__header">
          <h2 className="choose-activity-modal__title">{title}</h2>
          <button
            type="button"
            className="choose-activity-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="choose-activity-modal__body">
          <div className="choose-activity-modal__search">
            <input
              type="text"
              className="choose-activity-modal__search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="choose-activity-modal__list">
            {filteredActivities.length === 0 ? (
              <p className="choose-activity-modal__empty">{emptyText}</p>
            ) : (
              filteredActivities.map((activity) => {
                const isExpanded = expandedActivity?.name === activity.name;
                return (
                  <div key={activity.name} className="choose-activity-modal__item-wrapper">
                    <button
                      type="button"
                      className={`choose-activity-modal__item ${isExpanded ? 'choose-activity-modal__item--expanded' : ''}`}
                      onClick={() => handleActivityClick(activity)}
                      disabled={isLoading}
                    >
                      {activity.icon ? (
                        <IconRenderer iconName={activity.icon} size={24} className="choose-activity-modal__item-icon" />
                      ) : (
                        <span className="choose-activity-modal__item-empty">&#60;&#62;</span>
                      )}
                      <span className="choose-activity-modal__item-name">{activity.name}</span>
                    </button>
                    
                    {isExpanded && (
                      <div className="choose-activity-modal__actions">
                        <button
                          type="button"
                          className="choose-activity-modal__action-btn choose-activity-modal__action-btn--confirm"
                          onClick={() => handleConfirm(activity)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Loading...' : confirmLabel}
                        </button>
                        <button
                          type="button"
                          className="choose-activity-modal__action-btn choose-activity-modal__action-btn--update"
                          onClick={() => handleUpdate(activity)}
                          disabled={isLoading}
                        >
                          Update Icon
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseActivityModal;
