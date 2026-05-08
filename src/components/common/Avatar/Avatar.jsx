import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuHouse } from 'react-icons/lu';
import { useCharacter } from '../../../contexts';

const Avatar = () => {
  const navigate = useNavigate();
  const data = useCharacter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(data.avatarUrl || null);
  const imgRef = useRef(null);
  const showLoading = data.avatarLoading || (avatarSrc && !imageLoaded && !hasError);
  const showPlaceholder = !showLoading && (!avatarSrc || hasError);

  useEffect(() => {
    setAvatarSrc(data.avatarUrl || null);
    setImageLoaded(false);
    setHasError(false);
  }, [data.avatarUrl]);

  // If the image is already in cache (preloaded), onLoad may not fire reliably.
  // This ensures we flip to loaded state when the browser already has the image.
  useEffect(() => {
    if (!avatarSrc || hasError) return;
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [avatarSrc, hasError]);

  const xpPercentage = (data.currentXP / data.maxXP) * 100;

  return (
    <div className="avatar-container">
      <button
        className="pet-home-button"
        onClick={() => navigate('/pet')}
        aria-label="Go to Pet page"
        title="Pet"
      >
        <LuHouse />
      </button>
      <div className="avatar-frame">
        {showLoading && (
          <div className="avatar-loading" aria-label="Loading avatar">
            <div className="loading-spinner"></div>
            <div className="avatar-loading-text">Loading</div>
          </div>
        )}
        {showPlaceholder && (
          <div className="avatar-placeholder" aria-label="Avatar unavailable">
            <span>?</span>
          </div>
        )}
        {avatarSrc && !hasError && (
          <img 
            ref={imgRef}
            src={avatarSrc}
            alt="Character Avatar" 
            className="avatar-img"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width="300"
            height="300"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setHasError(true);
              setImageLoaded(false);
            }}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        )}
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
