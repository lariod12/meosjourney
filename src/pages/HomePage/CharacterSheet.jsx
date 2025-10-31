import { Header, Footer } from '../../components/layout';
import { Avatar } from '../../components/common';
import { StatusBox, DailyActivities } from '../../features/character/components';
import { LanguageProvider } from '../../contexts';

const CharacterSheet = () => {
  return (
    <LanguageProvider initialLang="VI">
      <div className="character-sheet">
        <Header />
        <div className="main-layout">
          <div className="left-sidebar">
            <Avatar />
            <StatusBox />
          </div>
          <div className="right-content">
            <DailyActivities />
          </div>
        </div>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default CharacterSheet;
