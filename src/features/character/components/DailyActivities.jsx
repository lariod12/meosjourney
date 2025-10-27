import TabNavigation from './TabNavigation';
import { QuestsTab } from '../../quests/components';
import { JournalTab, HistoryTab } from '../../journal/components';
import { AchievementsTab } from '../../achievements/components';

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
      label: 'ACHIEVEMENTS',
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
