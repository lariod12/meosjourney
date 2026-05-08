import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuHouse, LuArrowLeft } from 'react-icons/lu';
import { useCharacter } from '../../../contexts';

const Avatar = () => {
  const navigate = useNavigate();
  const data = useCharacter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(data.avatarUrl || null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

  const handleMyHomeClick = () => {
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '0929') {
      setShowPasswordModal(false);
      setIsFlipped(false);
      navigate('/pet');
    } else {
      setPasswordError('Wrong password!');
      setPassword('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  return (
    <div className="avatar-container">
      <div className={`avatar-flip-card ${isFlipped ? 'avatar-flip-card--flipped' : ''}`}>
        {/* Front side - Avatar */}
        <div className="avatar-flip-card__side avatar-flip-card__side--front">
          <div
            className="avatar-frame avatar-frame--clickable"
            onClick={() => setIsFlipped(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(true)}
            aria-label="Click to show navigation options"
          >
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
        </div>

        {/* Back side - Navigation */}
        <div className="avatar-flip-card__side avatar-flip-card__side--back">
          <div className="avatar-nav">
            <div className="avatar-nav__icon">
              <LuHouse />
            </div>
            <div className="avatar-nav__buttons">
              <button
                type="button"
                className="avatar-nav__button avatar-nav__button--primary"
                onClick={handleMyHomeClick}
              >
                My Home
              </button>
              <button
                type="button"
                className="avatar-nav__button"
                onClick={() => setIsFlipped(false)}
              >
                <LuArrowLeft />
                Back
              </button>
            </div>
          </div>
        </div>
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={handlePasswordCancel}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="password-modal__title">Enter Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="password-modal__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                autoComplete="off"
              />
              {passwordError && (
                <p className="password-modal__error">{passwordError}</p>
              )}
              <div className="password-modal__buttons">
                <button
                  type="button"
                  className="password-modal__button"
                  onClick={handlePasswordCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="password-modal__button password-modal__button--primary"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avatar;
