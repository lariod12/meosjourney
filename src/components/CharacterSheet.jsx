import Header from './Header';
import Avatar from './Avatar';
import StatusBox from './StatusBox';
import DailyActivities from './DailyActivities';
import Footer from './Footer';

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
