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

const IconPicker = ({ value, onChange, placeholder = "Search icons..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const filtered = Object.keys(allIcons)
        .filter(iconName => iconName.toLowerCase().includes(search))
        .slice(0, 50); // Limit to 50 results for performance
      setFilteredIcons(filtered);
    } else {
      setFilteredIcons([]);
    }
  }, [searchTerm]);

  const handleIconSelect = (iconName) => {
    console.log('Icon selected:', iconName);
    onChange({ target: { name: 'icon', value: iconName } });
    setSearchTerm('');
    setIsOpen(false);
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
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="icon-picker-input"
        />
        {value && (
          <div className="icon-picker-preview">
            {renderIcon(value)}
          </div>
        )}
      </div>

      {isOpen && filteredIcons.length > 0 && (
        <div className="icon-picker-dropdown">
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
        </div>
      )}

      {isOpen && searchTerm && filteredIcons.length === 0 && (
        <div className="icon-picker-dropdown">
          <div className="icon-picker-empty">No icons found</div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
