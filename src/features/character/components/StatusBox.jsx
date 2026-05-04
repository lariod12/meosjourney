import { useState } from 'react';
import { useCharacter } from '../../../contexts/CharacterContext';
import TabNavigation from './TabNavigation';
import { TimeAgo } from '../../../components/common';
import { useLanguage } from '../../../contexts';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';

const StatusBox = () => {
  const data = useCharacter();
  const [pageLoadTime] = useState(() => new Date());
  const { t } = useLanguage();

  const getStatusText = (value) => {
    if (Array.isArray(value)) {
      return getStatusText(value[0]);
    }

    if (value && typeof value === 'object') {
      return typeof value.name === 'string' ? value.name : '';
    }

    return value || '';
  };

  const getStatusIcon = (value) => {
    if (Array.isArray(value)) {
      return getStatusIcon(value[0]);
    }

    if (value && typeof value === 'object') {
      return typeof value.icon === 'string' ? value.icon : '';
    }

    return '';
  };

  const currentActivityText = getStatusText(data.status.doing);
  const currentActivityIcon = getStatusIcon(data.status.doing);

  const tabs = [
    {
      id: 'status',
      label: t('status.tab_status'),
      contentClassName: 'status-tab-content',
      content: (
        <div className="status-content">
          <div className="status-indicator">
            {currentActivityIcon && (
              <IconRenderer iconName={currentActivityIcon} size={18} className="status-activity-icon" />
            )}
            <span>
              {currentActivityText}
            </span>
          </div>
          <div className="status-location">
            <span className="status-label">{t('status.location')}</span>
            <span>
              {getStatusText(data.status.location)}
            </span>
          </div>
          <div className="status-mood">
            <span className="status-label">{t('status.mood')}</span>
            <span>
              {getStatusText(data.status.mood)}
            </span>
          </div>
          <div className="status-time">
            {t('status.updated')} <TimeAgo timestamp={pageLoadTime} /> <span className="status-refresh-note">{t('status.refresh_note')}</span>
          </div>
        </div>
      )
    },
    {
      id: 'introduce',
      label: t('status.tab_introduce'),
      contentClassName: 'status-tab-content',
      content: (
        <div className="introduce-content">
          <p>{data.introduce}</p>
        </div>
      )
    },
    {
      id: 'skills',
      label: t('status.tab_skills'),
      contentClassName: 'status-tab-content',
      content: (
        <div className="skills-content">
          <div className="tags-container">
            {data.skills.map((skill, index) => (
              <span key={index} className="tag">{skill.name}</span>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'hobbies',
      label: t('status.tab_hobbies'),
      contentClassName: 'status-tab-content',
      content: (
        <div className="hobbies-content">
          <div className="tags-container">
            {data.hobbies.map((hobby, index) => (
              <span key={index} className="tag">{hobby.name}</span>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="status-box">
      <TabNavigation tabs={tabs} navClassName="status-tab-nav" btnClassName="status-tab-btn" />
    </div>
  );
};

export default StatusBox;
