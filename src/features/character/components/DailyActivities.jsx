import TabNavigation from './TabNavigation';
import { useLanguage } from '../../../contexts';
import { QuestsTab } from '../../quests/components';
import { JournalTab, HistoryTab } from '../../journal/components';
import { AchievementsTab } from '../../achievements/components';

const DailyActivities = () => {
  const { t } = useLanguage();
  const tabs = [
    {
      id: 'journal',
      label: t('daily.journal'),
      content: <JournalTab />
    },
    {
      id: 'quests',
      label: t('daily.quests'),
      content: <QuestsTab />
    },
    {
      id: 'achievements',
      label: t('daily.achievements'),
      content: <AchievementsTab />
    },
    {
      id: 'history',
      label: t('daily.history'),
      content: <HistoryTab />
    }
  ];

  return (
    <div className="daily-activities-section">
      <TabNavigation tabs={tabs} />
    </div>
  );
};

export default DailyActivities;
