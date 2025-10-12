import { useCharacter } from '../contexts/CharacterContext';
import { getTimeAgo } from '../utils/dateUtils';
import TabNavigation from './TabNavigation';

const StatusBox = () => {
  const data = useCharacter();

  const tabs = [
    {
      id: 'status',
      label: 'STATUS',
      contentClassName: 'status-tab-content',
      content: (
        <div className="status-content">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>{data.status.doing}</span>
          </div>
          <div className="status-location">
            <span className="status-label">Location:</span>
            <span>{data.status.location}</span>
          </div>
          <div className="status-mood">
            <span className="status-label">Mood:</span>
            <span>{data.status.mood}</span>
          </div>
          <div className="status-time">
            Updated: {getTimeAgo(data.status.timestamp)}
          </div>
        </div>
      )
    },
    {
      id: 'introduce',
      label: 'INTRODUCE',
      contentClassName: 'status-tab-content',
      content: (
        <div className="introduce-content">
          <p>{data.introduce}</p>
        </div>
      )
    },
    {
      id: 'skills',
      label: 'SKILLS',
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
      label: 'HOBBIES',
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
