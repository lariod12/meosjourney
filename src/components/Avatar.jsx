import { useCharacter } from '../contexts/CharacterContext';
import { useAvatar } from '../hooks/useAvatar';

const Avatar = () => {
  const data = useCharacter();
  const avatarUrl = useAvatar();

  const xpPercentage = (data.currentXP / data.maxXP) * 100;

  return (
    <div className="avatar-container">
      <div className="avatar-frame">
        <img src={avatarUrl} alt="Character Avatar" className="avatar-img" />
        <div className="avatar-border"></div>
      </div>

      <div className="character-name">{data.name}</div>
      <div className="character-title">{data.caption}</div>

      <div className="xp-bar-wrapper">
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPercentage}%` }}></div>
          <div className="level-label">LEVEL {data.level}</div>
        </div>
        <div className="xp-text">
          {data.currentXP.toLocaleString()} / {data.maxXP.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
};

export default Avatar;
