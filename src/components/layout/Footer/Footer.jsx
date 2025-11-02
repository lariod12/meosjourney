import { useEffect, useRef, useState } from 'react';
import { useCharacter, useLanguage } from '../../../contexts';

const Footer = () => {
  const data = useCharacter();
  const { t } = useLanguage();
  const [activeSocial, setActiveSocial] = useState(null);
  const socialLinksRef = useRef(null);
  const detailRef = useRef(null);

  const getUrl = (key) => {
    if (!data?.social) return '';
    if (key === 'gmail') return data.social.gmail ? `mailto:${data.social.gmail}` : '';
    return data.social[key] || '';
  };

  const getLabel = (key) => {
    switch (key) {
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      case 'tiktok':
        return 'TikTok';
      case 'youtube':
        return 'YouTube';
      case 'gmail':
        return 'Gmail';
      default:
        return '';
    }
  };

  const openActive = () => {
    if (!activeSocial) return;
    const url = getUrl(activeSocial);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (!activeSocial) return;
    const onOutside = (e) => {
      if (detailRef.current && detailRef.current.contains(e.target)) return;
      if (socialLinksRef.current && socialLinksRef.current.contains(e.target)) return;
      setActiveSocial(null);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [activeSocial]);

  return (
    <div className="sheet-footer">
      <div className="decorative-line"></div>
      <div className="footer-content">
        <div className="footer-title">{t('footer.connect')}</div>
        <div className="social-links" ref={socialLinksRef}>
          <a
            href={data.social.facebook}
            className="social-link"
            title={data.social.facebook ? `Facebook: ${data.social.facebook}` : 'Facebook'}
            onClick={(e) => {
              e.preventDefault();
              setActiveSocial((prev) => (prev === 'facebook' ? null : 'facebook'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSocial((prev) => (prev === 'facebook' ? null : 'facebook'));
              }
            }}
          >
            <i className="fab fa-facebook"></i>
            <span>Facebook</span>
          </a>
          <a
            href={data.social.instagram}
            className="social-link"
            title={data.social.instagram ? `Instagram: ${data.social.instagram}` : 'Instagram'}
            onClick={(e) => {
              e.preventDefault();
              setActiveSocial((prev) => (prev === 'instagram' ? null : 'instagram'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSocial((prev) => (prev === 'instagram' ? null : 'instagram'));
              }
            }}
          >
            <i className="fab fa-instagram"></i>
            <span>Instagram</span>
          </a>
          <a
            href={data.social.tiktok}
            className="social-link"
            title={data.social.tiktok ? `TikTok: ${data.social.tiktok}` : 'TikTok'}
            onClick={(e) => {
              e.preventDefault();
              setActiveSocial((prev) => (prev === 'tiktok' ? null : 'tiktok'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSocial((prev) => (prev === 'tiktok' ? null : 'tiktok'));
              }
            }}
          >
            <i className="fab fa-tiktok"></i>
            <span>TikTok</span>
          </a>
          <a
            href={data.social.youtube}
            className="social-link"
            title={data.social.youtube ? `YouTube: ${data.social.youtube}` : 'YouTube'}
            onClick={(e) => {
              e.preventDefault();
              setActiveSocial((prev) => (prev === 'youtube' ? null : 'youtube'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSocial((prev) => (prev === 'youtube' ? null : 'youtube'));
              }
            }}
          >
            <i className="fab fa-youtube"></i>
            <span>YouTube</span>
          </a>
          <a
            href={`mailto:${data.social.gmail}`}
            className="social-link"
            title={data.social.gmail ? `Email: ${data.social.gmail}` : 'Gmail'}
            onClick={(e) => {
              e.preventDefault();
              setActiveSocial((prev) => (prev === 'gmail' ? null : 'gmail'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveSocial((prev) => (prev === 'gmail' ? null : 'gmail'));
              }
            }}
          >
            <i className="fas fa-envelope"></i>
            <span>Gmail</span>
          </a>
        </div>
        {activeSocial && (
          <div className="footer-detail-box" role="region" aria-live="polite" ref={detailRef}>
            <div className="footer-detail-text">
              {getLabel(activeSocial)}:{' '}
              <span className="footer-detail-value">{activeSocial === 'gmail' ? (data?.social?.gmail || '') : getUrl(activeSocial)}</span>
            </div>
            <button type="button" className="footer-open-btn" onClick={openActive}>
              {t('footer.open_link')}
            </button>
          </div>
        )}
        <div className="footer-copyright">
          © 2025 by {data.name} | All rights reserved.
        </div>
        <div className="footer-version">
          {t('footer.version_label')} 1.0
        </div>
      </div>
    </div>
  );
};

export default Footer;
