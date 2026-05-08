/**
 * Biological Clock Background Updates
 * Handles pet state updates when app resumes from background
 */

/**
 * Check if a meal time was passed during background period
 * @param {number} lastTime - Last active timestamp
 * @param {number} currentTime - Current timestamp
 * @returns {Array} Array of missed meal times
 */
export const getMissedMealTimes = (lastTime, currentTime) => {
  const missedMeals = [];
  const mealTimes = [
    { name: 'breakfast', hour: 8, minute: 0 },
    { name: 'lunch', hour: 11, minute: 0 },
    { name: 'dinner', hour: 18, minute: 0 }
  ];

  const lastDate = new Date(lastTime);
  const currentDate = new Date(currentTime);

  // Check each meal time
  mealTimes.forEach(meal => {
    const mealDate = new Date(currentDate);
    mealDate.setHours(meal.hour, meal.minute, 0, 0);

    // If meal time is between last active and now
    if (mealDate > lastDate && mealDate <= currentDate) {
      missedMeals.push({
        ...meal,
        timestamp: mealDate.getTime()
      });
    }
  });

  return missedMeals;
};

/**
 * Check if bedtime was passed during background period
 * @param {number} lastTime - Last active timestamp
 * @param {number} currentTime - Current timestamp
 * @returns {boolean}
 */
export const wasBedtimePassed = (lastTime, currentTime) => {
  const lastDate = new Date(lastTime);
  const currentDate = new Date(currentTime);

  // Bedtime is 22:00 (10 PM) to 05:00 (5 AM)
  const bedtimeStart = 22;
  const bedtimeEnd = 5;

  // Check if any hour between lastTime and currentTime falls in bedtime range
  let checkDate = new Date(lastDate);
  while (checkDate <= currentDate) {
    const hour = checkDate.getHours();
    if (hour >= bedtimeStart || hour < bedtimeEnd) {
      return true;
    }
    checkDate.setHours(checkDate.getHours() + 1);
  }

  return false;
};

/**
 * Calculate hunger penalty for missed meals
 * @param {Array} missedMeals - Array of missed meal times
 * @param {number} currentTime - Current timestamp
 * @returns {number} Total hunger penalty
 */
export const calculateHungerPenalty = (missedMeals, currentTime) => {
  let totalPenalty = 0;

  missedMeals.forEach(meal => {
    // Calculate minutes since meal time
    const minutesSinceMeal = Math.floor((currentTime - meal.timestamp) / 60000);

    // Penalty: -1 hunger every 5 minutes after meal time
    const penalty = Math.floor(minutesSinceMeal / 5);
    totalPenalty += penalty;
  });

  return totalPenalty;
};

/**
 * Calculate sleep penalty for missed bedtime
 * @param {number} lastTime - Last active timestamp
 * @param {number} currentTime - Current timestamp
 * @returns {number} Total sleep penalty
 */
export const calculateSleepPenalty = (lastTime, currentTime) => {
  const lastDate = new Date(lastTime);
  const currentDate = new Date(currentTime);

  let totalMinutesInBedtime = 0;

  // Count minutes spent in bedtime range (22:00-05:00)
  let checkDate = new Date(lastDate);
  while (checkDate <= currentDate) {
    const hour = checkDate.getHours();
    if (hour >= 22 || hour < 5) {
      totalMinutesInBedtime++;
    }
    checkDate.setMinutes(checkDate.getMinutes() + 1);
  }

  // Penalty: -1 sanity every 5 minutes during bedtime
  return Math.floor(totalMinutesInBedtime / 5);
};

/**
 * Apply background penalties to pet status
 * @param {Object} currentStatus - Current pet status
 * @param {number} lastTime - Last active timestamp
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Updated status with penalties applied
 */
export const applyBackgroundPenalties = (currentStatus, lastTime, currentTime) => {
  const missedMeals = getMissedMealTimes(lastTime, currentTime);
  const bedtimePassed = wasBedtimePassed(lastTime, currentTime);

  const updates = { ...currentStatus };

  // Apply hunger penalty
  if (missedMeals.length > 0) {
    const hungerPenalty = calculateHungerPenalty(missedMeals, currentTime);
    updates.hunger = Math.max(0, (currentStatus.hunger || 100) - hungerPenalty);
    console.log(`Applied hunger penalty: -${hungerPenalty} (missed ${missedMeals.length} meals)`);
  }

  // Apply sleep penalty
  if (bedtimePassed) {
    const sleepPenalty = calculateSleepPenalty(lastTime, currentTime);
    updates.sanity = Math.max(0, (currentStatus.sanity || 100) - sleepPenalty);
    console.log(`Applied sleep penalty: -${sleepPenalty}`);
  }

  return updates;
};
