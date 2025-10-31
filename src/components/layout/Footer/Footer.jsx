import { useCharacter, useLanguage } from '../../../contexts';

const Footer = () => {
  const data = useCharacter();
  const { t } = useLanguage();

  return (
    <div className="sheet-footer">
      <div className="decorative-line"></div>
      <div className="footer-content">
        <div className="footer-title">{t('footer.connect')}</div>
        <div className="social-links">
          <a
            href={data.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            title={data.social.facebook ? `Facebook: ${data.social.facebook}` : 'Facebook'}
          >
            <i className="fab fa-facebook"></i>
            <span>Facebook</span>
          </a>
          <a
            href={data.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            title={data.social.instagram ? `Instagram: ${data.social.instagram}` : 'Instagram'}
          >
            <i className="fab fa-instagram"></i>
            <span>Instagram</span>
          </a>
          <a
            href={data.social.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            title={data.social.tiktok ? `TikTok: ${data.social.tiktok}` : 'TikTok'}
          >
            <i className="fab fa-tiktok"></i>
            <span>TikTok</span>
          </a>
          <a
            href={data.social.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            title={data.social.youtube ? `YouTube: ${data.social.youtube}` : 'YouTube'}
          >
            <i className="fab fa-youtube"></i>
            <span>YouTube</span>
          </a>
          <a
            href={`mailto:${data.social.gmail}`}
            className="social-link"
            title={data.social.gmail ? `Email: ${data.social.gmail}` : 'Gmail'}
          >
            <i className="fas fa-envelope"></i>
            <span>Gmail</span>
          </a>
        </div>
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
