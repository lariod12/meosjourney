import { useCharacter } from '../../../contexts';

const Footer = () => {
  const data = useCharacter();

  return (
    <div className="sheet-footer">
      <div className="decorative-line"></div>
      <div className="footer-content">
        <div className="footer-title">CONNECT WITH ME</div>
        <div className="social-links">
          <a href={data.social.facebook} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
            <i className="fab fa-facebook"></i>
            <span>Facebook</span>
          </a>
          <a href={data.social.instagram} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
            <i className="fab fa-instagram"></i>
            <span>Instagram</span>
          </a>
          <a href={data.social.tiktok} target="_blank" rel="noopener noreferrer" className="social-link" title="TikTok">
            <i className="fab fa-tiktok"></i>
            <span>TikTok</span>
          </a>
          <a href={data.social.youtube} target="_blank" rel="noopener noreferrer" className="social-link" title="YouTube">
            <i className="fab fa-youtube"></i>
            <span>YouTube</span>
          </a>
          <a href={`mailto:${data.social.gmail}`} className="social-link" title="Gmail">
            <i className="fas fa-envelope"></i>
            <span>Gmail</span>
          </a>
        </div>
        <div className="footer-copyright">
          © 2025 by {data.name} | All rights reserved.
        </div>
        <div className="footer-version">
          Version 1.0
        </div>
      </div>
    </div>
  );
};

export default Footer;
