import { useState, useEffect, useRef } from 'react';
import '../styles/update-location-modal.css';

const UpdateLocationModal = ({
  isOpen,
  onClose,
  onSave,
  currentLocation = 'Home',
  locationHistory = [],
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState(currentLocation);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentLocation);
      setIsDropdownOpen(false);
    }
  }, [isOpen, currentLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Auto-scroll modal body when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && bodyRef.current && inputRef.current && dropdownRef.current) {
      // Wait for dropdown to render
      setTimeout(() => {
        const inputRect = inputRef.current.getBoundingClientRect();
        const bodyRect = bodyRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current.offsetHeight;

        // Only scroll if dropdown has content
        if (dropdownHeight > 0) {
          const dropdownBottom = inputRect.bottom + dropdownHeight + 8; // 8px gap
          const bodyBottom = bodyRect.bottom;

          if (dropdownBottom > bodyBottom) {
            // Calculate scroll amount needed to show dropdown
            const neededScroll = dropdownBottom - bodyBottom + 20; // 20px extra padding

            // Calculate max scroll without hiding input
            const inputTop = inputRect.top;
            const bodyTop = bodyRect.top;
            const inputVisibleHeight = inputRect.height;

            // Max scroll = keep at least input visible
            const maxAllowedScroll = inputTop - bodyTop - 10; // 10px padding from top

            // Check if body can actually scroll
            const maxBodyScroll = bodyRef.current.scrollHeight - bodyRef.current.clientHeight;

            if (maxBodyScroll > 0 && maxAllowedScroll > 0) {
              // Scroll the minimum of: needed, allowed, and possible
              const scrollAmount = Math.min(neededScroll, maxAllowedScroll, maxBodyScroll);

              if (scrollAmount > 0) {
                bodyRef.current.scrollBy({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
              }
            }
          }
        }
      }, 50);
    }
  }, [isDropdownOpen]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSave = () => {
    if (isLoading) return;

    const locationToSave = inputValue.trim();
    if (!locationToSave) return;

    onSave(locationToSave);
  };

  const handleSelectLocation = (location) => {
    setInputValue(location);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleClearInput = () => {
    setInputValue('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (locationHistory.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Auto-open dropdown when typing
    if (e.target.value && locationHistory.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const isFormValid = inputValue.trim().length > 0;

  if (!isOpen) return null;

  // Filter locations based on input
  const filteredLocations = locationHistory.filter(location =>
    location.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="update-location-modal-overlay" onClick={handleClose}>
      <div className="update-location-modal" onClick={(e) => e.stopPropagation()}>
        <div className="update-location-modal__header">
          <h2 className="update-location-modal__title">Update Location</h2>
          <button
            type="button"
            className="update-location-modal__close"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div ref={bodyRef} className="update-location-modal__body">
          <div className="update-location-modal__current">
            <span className="update-location-modal__current-label">Current:</span>
            <span className="update-location-modal__current-value">{currentLocation}</span>
          </div>

          <div className="update-location-modal__field">
            <label htmlFor="location-input" className="update-location-modal__label">
              Location
            </label>
            <div className="update-location-modal__input-wrapper">
              <input
                ref={inputRef}
                id="location-input"
                type="text"
                className="update-location-modal__input"
                placeholder="Enter or select location..."
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                disabled={isLoading}
                autoFocus
              />
              {inputValue && (
                <button
                  type="button"
                  className="update-location-modal__clear-button"
                  onClick={handleClearInput}
                  disabled={isLoading}
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
              {locationHistory.length > 0 && (
                <button
                  type="button"
                  className={`update-location-modal__dropdown-toggle ${isDropdownOpen ? 'update-location-modal__dropdown-toggle--open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isLoading}
                  aria-label="Toggle location dropdown"
                >
                  ▼
                </button>
              )}
              {isDropdownOpen && filteredLocations.length > 0 && (
                <div ref={dropdownRef} className="update-location-modal__dropdown">
                  {filteredLocations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      className={`update-location-modal__dropdown-item ${location === inputValue ? 'update-location-modal__dropdown-item--selected' : ''}`}
                      onClick={() => handleSelectLocation(location)}
                      disabled={isLoading}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="update-location-modal__footer">
          <button
            type="button"
            className="update-location-modal__button update-location-modal__button--cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="update-location-modal__button update-location-modal__button--save"
            onClick={handleSave}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? 'Saving...' : 'Update Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLocationModal;
