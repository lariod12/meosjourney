import { useCharacter } from '../../../contexts';
import { useAvatar } from '../../../hooks';

const Avatar = () => {
  const data = useCharacter();
  const avatarUrl = useAvatar();

  const xpPercentage = (data.currentXP / data.maxXP) * 100;

  return (
    <div className="avatar-container">
      <div className="avatar-frame">
        <img src={avatarUrl} alt="Character Avatar" className="avatar-img" />
      </div>

      <div className="character-name">{data.name}</div>
      <div className="caption">{data.caption}</div>

      <div className="xp-bar-wrapper">
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPercentage}%` }}></div>
          <div className="level-label">LEVEL {data.level}</div>
        </div>
        <div className="xp-text">
          <div className="xp-current">{data.currentXP.toLocaleString()}</div>
          <div className="xp-max">{data.maxXP.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default Avatar;
