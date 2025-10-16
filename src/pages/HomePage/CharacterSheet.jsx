import { Header, Footer } from '../../components/layout';
import { Avatar } from '../../components/common';
import { StatusBox, DailyActivities } from '../../features/character/components';

const CharacterSheet = () => {
  return (
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
  );
};

export default CharacterSheet;
