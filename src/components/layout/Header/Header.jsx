import { useLanguage } from '../../../contexts';
import './Header.css';

const Header = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="sheet-header">
      <div className="header-lang-row">
        <div className="header-lang-toggle" role="group" aria-label="Language toggle">
          <button
            type="button"
            className={`header-lang-btn ${lang === 'VI' ? 'header-lang-btn--active' : ''}`}
            aria-pressed={lang === 'VI'}
            onClick={() => setLang('VI')}
          >
            VI
          </button>
          <button
            type="button"
            className={`header-lang-btn ${lang === 'EN' ? 'header-lang-btn--active' : ''}`}
            aria-pressed={lang === 'EN'}
            onClick={() => setLang('EN')}
          >
            EN
          </button>
        </div>
      </div>
      <h1 className="title-sketch">{t('header.title')}</h1>
      <div className="decorative-line"></div>
    </div>
  );
};

export default Header;
