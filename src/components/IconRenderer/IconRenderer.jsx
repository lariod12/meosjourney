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

const IconRenderer = ({ iconName, size = 24, className = '' }) => {
  // If iconName is emoji or regular text, render as is
  if (!iconName || !allIcons[iconName]) {
    return <span className={className}>{iconName || '❓'}</span>;
  }

  const IconComponent = allIcons[iconName];
  return <IconComponent size={size} className={className} />;
};

export default IconRenderer;
