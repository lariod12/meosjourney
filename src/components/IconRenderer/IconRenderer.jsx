import { ICON_REGISTRY } from './iconRegistry';

const IconRenderer = ({ iconName, size = 24, className = '' }) => {
  // If iconName is emoji or regular text, render as is
  if (!iconName || !ICON_REGISTRY[iconName]) {
    return <span className={className}>{iconName || '❓'}</span>;
  }

  const IconComponent = ICON_REGISTRY[iconName];
  return <IconComponent size={size} className={className} />;
};

export default IconRenderer;
