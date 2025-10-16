import { useState, useEffect } from 'react';
import { getTimeAgo } from '../../../utils/dateUtils';

const TimeAgo = ({ timestamp, updateInterval = 30000 }) => {
  const [timeText, setTimeText] = useState(getTimeAgo(timestamp));

  useEffect(() => {
    // Update immediately when timestamp changes
    setTimeText(getTimeAgo(timestamp));

    // Set up interval to update time text periodically
    const interval = setInterval(() => {
      setTimeText(getTimeAgo(timestamp));
    }, updateInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [timestamp, updateInterval]);

  return <>{timeText}</>;
};

export default TimeAgo;
