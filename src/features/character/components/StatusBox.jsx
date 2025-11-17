import { useState } from 'react';
import { useCharacter } from '../../../contexts/CharacterContext';
import TabNavigation from './TabNavigation';
import { TimeAgo } from '../../../components/common';
import { useLanguage } from '../../../contexts';

const StatusBox = () => {
  const data = useCharacter();
  const [pageLoadTime] = useState(() => new Date());
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'status',
      label: t('status.tab_status'),
      contentClassName: 'status-tab-content',
      content: (
        <div className="status-content">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>
              {Array.isArray(data.status.doing)
                ? (data.status.doing[0] || '')
                : (data.status.doing || '')}
            </span>
          </div>
          <div className="status-location">
            <span className="status-label">{t('status.location')}</span>
            <span>
              {Array.isArray(data.status.location)
                ? (data.status.location[0] || '')
                : (data.status.location || '')}
            </span>
          </div>
          <div className="status-mood">
            <span className="status-label">{t('status.mood')}</span>
            <span>
              {Array.isArray(data.status.mood)
                ? (data.status.mood[0] || '')
                : (data.status.mood || '')}
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
            {data.interests.map((interest, index) => (
              <span key={index} className="tag">{interest.name}</span>
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
