import { useEffect, useState } from 'react';
import { useCharacter } from '../../../contexts';

const Avatar = () => {
  const data = useCharacter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const defaultAvatar = "https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300";
  const resolvedAvatar = data.avatarUrl || defaultAvatar;
  const [avatarSrc, setAvatarSrc] = useState(resolvedAvatar);

  useEffect(() => {
    setAvatarSrc(resolvedAvatar);
    setImageLoaded(false);
  }, [resolvedAvatar]);

  const xpPercentage = (data.currentXP / data.maxXP) * 100;

  return (
    <div className="avatar-container">
      <div className="avatar-frame">
        {!imageLoaded && (
          <div className="avatar-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        <img 
          src={avatarSrc}
          alt="Character Avatar" 
          className="avatar-img"
          loading="lazy"
          decoding="async"
          fetchpriority="high"
          width="300"
          height="300"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (avatarSrc !== defaultAvatar) {
              setAvatarSrc(defaultAvatar);
            } else {
              setImageLoaded(true);
            }
          }}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
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
