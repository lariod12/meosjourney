import { useState, useEffect } from 'react';
import { getTimeAgo } from '../../../utils/dateUtils';
import { useLanguage } from '../../../contexts';

const TimeAgo = ({ timestamp, updateInterval = 30000 }) => {
  const { lang } = useLanguage();
  const [timeText, setTimeText] = useState(getTimeAgo(timestamp, lang));

  useEffect(() => {
    // Update immediately when timestamp or language changes
    setTimeText(getTimeAgo(timestamp, lang));

    // Set up interval to update time text periodically
    const interval = setInterval(() => {
      setTimeText(getTimeAgo(timestamp, lang));
    }, updateInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [timestamp, lang, updateInterval]);

  return <>{timeText}</>;
};

export default TimeAgo;
