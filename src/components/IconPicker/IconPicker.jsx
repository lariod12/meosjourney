import { useState, useEffect, useRef } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as IoIcons from 'react-icons/io5';
import * as BiIcons from 'react-icons/bi';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as FiIcons from 'react-icons/fi';
import * as GiIcons from 'react-icons/gi';
import * as HiIcons from 'react-icons/hi2';
import * as RiIcons from 'react-icons/ri';
import './IconPicker.css';

// Combine all icon libraries
const allIcons = {
  ...FaIcons,
  ...MdIcons,
  ...IoIcons,
  ...BiIcons,
  ...AiIcons,
  ...BsIcons,
  ...FiIcons,
  ...GiIcons,
  ...HiIcons,
  ...RiIcons
};

const ICONS_PER_PAGE = 100;
const ALL_ICON_NAMES = Object.keys(allIcons);

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
      const allIconNames = ALL_ICON_NAMES.slice(0, displayCount);
      setFilteredIcons(allIconNames);
    } else if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const filtered = ALL_ICON_NAMES
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

    console.log('Scroll event:', { scrollTop, scrollHeight, clientHeight, scrollBottom });

    // Load more when near bottom (within 100px)
    if (scrollBottom < 100 && displayCount < ALL_ICON_NAMES.length) {
      console.log('Loading more icons...', displayCount, '->', displayCount + ICONS_PER_PAGE);
      setDisplayCount(prev => Math.min(prev + ICONS_PER_PAGE, ALL_ICON_NAMES.length));
    }
  };

  const handleIconSelect = (iconName) => {
    console.log('Icon selected:', iconName);
    onChange({ target: { name: 'icon', value: iconName } });
    setSearchTerm('');
    setIsOpen(false);
    setShowAll(false);
  };

  const handleShowAll = () => {
    console.log('Show all icons clicked');
    setShowAll(true);
    setIsOpen(true);
    setSearchTerm('');
    setDisplayCount(ICONS_PER_PAGE); // Reset to initial count
  };

  const renderIcon = (iconName) => {
    const IconComponent = allIcons[iconName];
    return IconComponent ? <IconComponent size={24} /> : null;
  };

  return (
    <div className="icon-picker" ref={containerRef}>
      <div className="icon-picker-input-wrapper">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowAll(false);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="icon-picker-input"
        />
        <button
          type="button"
          className="icon-picker-all-btn"
          onClick={handleShowAll}
          title="Show all icons"
        >
          All
        </button>
        {value && (
          <div className="icon-picker-preview">
            {renderIcon(value)}
          </div>
        )}
      </div>

      {isOpen && filteredIcons.length > 0 && (
        <div 
          className="icon-picker-dropdown" 
          ref={dropdownRef}
          onScroll={handleScroll}
        >
          {showAll && (
            <div className="icon-picker-header">
              Showing {filteredIcons.length} of {ALL_ICON_NAMES.length} icons
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
          {showAll && displayCount < ALL_ICON_NAMES.length && (
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
