import TabNavigation from './TabNavigation';
import QuestsTab from './QuestsTab';
import JournalTab from './JournalTab';
import HistoryTab from './HistoryTab';
import AchievementsTab from './AchievementsTab';

const DailyActivities = () => {
  const tabs = [
    {
      id: 'quests',
      label: 'DAILY QUESTS',
      content: <QuestsTab />
    },
    {
      id: 'journal',
      label: 'DAILY JOURNAL',
      content: <JournalTab />
    },
    {
      id: 'history',
      label: 'HISTORY',
      content: <HistoryTab />
    },
    {
      id: 'achievements',
      label: 'ACHIEVEMENT',
      content: <AchievementsTab />
    }
  ];

  return (
    <div className="daily-activities-section">
      <TabNavigation tabs={tabs} />
    </div>
  );
};

export default DailyActivities;
