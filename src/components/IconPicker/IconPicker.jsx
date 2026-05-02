import { useState, useEffect, useRef } from 'react';
import { ICON_NAMES, ICON_REGISTRY } from '../IconRenderer/iconRegistry';
import './IconPicker.css';

const ICONS_PER_PAGE = 100;

const IconPicker = ({ value, onChange, placeholder = "Search icons..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [displayCount, setDisplayCount] = useState(ICONS_PER_PAGE);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowAll(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showAll) {
      // Show all icons with pagination
      const allIconNames = ICON_NAMES.slice(0, displayCount);
      setFilteredIcons(allIconNames);
    } else if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const filtered = ICON_NAMES
        .filter(iconName => iconName.toLowerCase().includes(search))
        .slice(0, 50); // Limit to 50 results for performance
      setFilteredIcons(filtered);
    } else {
      setFilteredIcons([]);
    }
  }, [searchTerm, showAll, displayCount]);

  // Infinite scroll handler
  const handleScroll = (e) => {
    if (!showAll) return;

    const dropdown = e.target;
    const { scrollTop, scrollHeight, clientHeight } = dropdown;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    // Load more when near bottom (within 100px)
    if (scrollBottom < 100 && displayCount < ICON_NAMES.length) {
      setDisplayCount(prev => Math.min(prev + ICONS_PER_PAGE, ICON_NAMES.length));
    }
  };

  const handleIconSelect = (iconName) => {
    onChange({ target: { name: 'icon', value: iconName } });
    setSearchTerm('');
    setIsOpen(false);
    setShowAll(false);
  };

  const handleShowAll = () => {
    setShowAll(true);
    setIsOpen(true);
    setSearchTerm('');
    setDisplayCount(ICONS_PER_PAGE); // Reset to initial count
  };

  const handleClear = () => {
    console.log('Clear icon');
    onChange({ target: { name: 'icon', value: '' } });
    setSearchTerm('');
    setIsOpen(false);
    setShowAll(false);
  };

  const renderIcon = (iconName) => {
    const IconComponent = ICON_REGISTRY[iconName];
    return IconComponent ? <IconComponent size={24} /> : null;
  };

  return (
    <div className="icon-picker" ref={containerRef}>
      <div className="icon-picker-input-wrapper">
        <div className="icon-picker-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowAll(false);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={value ? '' : placeholder}
            className={`icon-picker-input ${value ? 'has-icon' : ''}`}
          />
          {value && (
            <div className="icon-picker-selected-preview">
              {renderIcon(value)}
            </div>
          )}
        </div>
        {value && (
          <button
            type="button"
            className="icon-picker-clear-btn"
            onClick={handleClear}
            title="Clear icon"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          className="icon-picker-all-btn"
          onClick={handleShowAll}
          title="Show all icons"
        >
          All
        </button>
      </div>

      {isOpen && filteredIcons.length > 0 && (
        <div
          className="icon-picker-dropdown"
          ref={dropdownRef}
          onScroll={handleScroll}
        >
          {showAll && (
            <div className="icon-picker-header">
              Showing {filteredIcons.length} of {ICON_NAMES.length} icons
            </div>
          )}
          <div className="icon-picker-grid">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                type="button"
                className="icon-picker-item"
                onClick={() => handleIconSelect(iconName)}
                title={iconName}
              >
                {renderIcon(iconName)}
              </button>
            ))}
          </div>
          {showAll && displayCount < ICON_NAMES.length && (
            <div className="icon-picker-loading">
              Scroll down to load more...
            </div>
          )}
        </div>
      )}

      {isOpen && searchTerm && !showAll && filteredIcons.length === 0 && (
        <div className="icon-picker-dropdown">
          <div className="icon-picker-empty">No icons found</div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
