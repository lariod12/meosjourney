import { collection, getDocs, doc, setDoc, serverTimestamp, getDocsFromServer, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { CHARACTER_ID } from '../config/constants';

export { CHARACTER_ID };

export const fetchFirstDocData = async (colPath, fromServer = false) => {
  const snap = fromServer
    ? await getDocsFromServer(collection(db, ...colPath))
    : await getDocs(collection(db, ...colPath));
  const first = snap.docs[0];
  return first ? { id: first.id, ...first.data() } : null;
};

export const fetchProfile = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'profile']);
};

export const saveProfile = async (profileData, characterId = CHARACTER_ID) => {
  try {
    // Fetch current profile to get its ID
    const currentProfile = await fetchProfile(characterId);

    if (!currentProfile || !currentProfile.id) {
      throw new Error('No profile document found. Please create one first.');
    }

    // Prepare data to update
    const dataToUpdate = {};
    
    if (profileData.introduce !== undefined) {
      dataToUpdate.introduce = profileData.introduce.trim();
    }
    
    if (profileData.skills !== undefined) {
      dataToUpdate.skills = Array.isArray(profileData.skills) ? profileData.skills : [];
    }
    
    if (profileData.interests !== undefined) {
      dataToUpdate.interests = Array.isArray(profileData.interests) ? profileData.interests : [];
    }

    // Only update if there's data to save
    if (Object.keys(dataToUpdate).length === 0) {
      return { success: false, message: 'No data to save' };
    }

    // Update profile document
    const profileDocRef = doc(db, 'main', characterId, 'profile', currentProfile.id);
    await setDoc(profileDocRef, dataToUpdate, { merge: true });

    console.log('✅ Profile updated successfully:', dataToUpdate);
    
    return { success: true, data: dataToUpdate };

  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw new Error(`Failed to save profile: ${error.message}`);
  }
};

export const updateProfileXP = async (xpToAdd, characterId = CHARACTER_ID) => {
  try {
    // Fetch current profile to get its ID and current XP
    const currentProfile = await fetchProfile(characterId);

    if (!currentProfile || !currentProfile.id) {
      throw new Error('No profile document found. Please create one first.');
    }

    const currentXP = Number.parseInt(currentProfile.currentXP, 10) || 0;
    const currentLevel = Number.parseInt(currentProfile.level, 10) || 0;
    const maxXP = Number.parseInt(currentProfile.maxXP, 10) || 1000;
    
    // Add XP
    let newXP = currentXP + xpToAdd;
    let newLevel = currentLevel;
    let leveledUp = false;

    // Check for level up (can level up multiple times if XP is high enough)
    // maxXP stays constant - does not increase with level
    // When leveling up, excess XP is reduced by half
    while (newXP >= maxXP) {
      newXP -= maxXP;
      newLevel += 1;
      leveledUp = true;
      
      // Reduce excess XP by half (penalty for leveling up)
      newXP = Math.floor(newXP / 2);
      
      console.log(`🎉 LEVEL UP! New level: ${newLevel}, Remaining XP after penalty: ${newXP}`);
    }

    // Prepare data to update (maxXP is not updated, stays constant)
    const dataToUpdate = {
      currentXP: newXP,
      level: newLevel
    };

    // Update profile with new XP and level
    const profileDocRef = doc(db, 'main', characterId, 'profile', currentProfile.id);
    await setDoc(profileDocRef, dataToUpdate, { merge: true });

    console.log(`✅ Profile XP updated: ${currentXP} + ${xpToAdd} = ${newXP} (Level: ${newLevel})`);
    
    return { 
      success: true, 
      oldXP: currentXP, 
      newXP, 
      addedXP: xpToAdd,
      oldLevel: currentLevel,
      newLevel,
      leveledUp,
      maxXP
    };

  } catch (error) {
    console.error('❌ Error updating profile XP:', error);
    throw new Error(`Failed to update XP: ${error.message}`);
  }
};

export const fetchConfig = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'config']);
};

export const setAutoApproveTasks = async (enabled, characterId = CHARACTER_ID) => {
  try {
    const cfg = await fetchConfig(characterId);
    if (!cfg || !cfg.id) {
      throw new Error('No config document found. Please create one first.');
    }
    const configRef = doc(db, 'main', characterId, 'config', cfg.id);
    await setDoc(configRef, { auto_approve_tasks: !!enabled }, { merge: true });
    return { success: true, value: !!enabled };
  } catch (error) {
    console.error('❌ Error setting auto_approve_tasks:', error);
    throw new Error(`Failed to update config: ${error.message}`);
  }
};

export const fetchStatus = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'status']);
};

export const fetchCharacterViewData = async (characterId = CHARACTER_ID, base = {}) => {
  try {
    const [profile, config, status, achievements, quests, journals] = await Promise.all([
      fetchProfile(characterId),
      fetchConfig(characterId),
      fetchStatus(characterId),
      fetchAchievements(characterId),
      fetchQuests(characterId),
      fetchJournals(characterId)
    ]);

    const skills = Array.isArray(profile?.skills) ? profile.skills.map((n) => ({ name: n })) : base.skills || [];
    const interests = Array.isArray(profile?.interests) ? profile.interests.map((n) => ({ name: n })) : base.interests || [];
    const introduce = typeof profile?.introduce === 'string' && profile.introduce.trim() ? profile.introduce : base.introduce || '';
    const name = typeof profile?.name === 'string' && profile.name.trim() ? profile.name : base.name;
    const caption = typeof profile?.caption === 'string' && profile.caption.trim() ? profile.caption : base.caption;

    // Social links: prefer database profile.socialLinks (or socialLink) then fallback to base
    const socialFromDb = profile?.socialLinks || profile?.socialLink || {};
    const social = {
      facebook: socialFromDb.facebook || base.social?.facebook || '',
      instagram: socialFromDb.instagram || base.social?.instagram || '',
      tiktok: socialFromDb.tiktok || base.social?.tiktok || '',
      youtube: socialFromDb.youtube || base.social?.youtube || '',
      // DB might store as 'mail' or 'gmail' -> normalize to gmail for UI
      gmail: socialFromDb.gmail || socialFromDb.mail || base.social?.gmail || ''
    };

    // Process status data
    let statusTimestamp = new Date();

    if (status?.timestamp) {
      // Firestore Timestamp object
      if (typeof status.timestamp.toDate === 'function') {
        statusTimestamp = status.timestamp.toDate();
      }
      // Already a Date object
      else if (status.timestamp instanceof Date) {
        statusTimestamp = status.timestamp;
      }
      // ISO string or timestamp number
      else {
        statusTimestamp = new Date(status.timestamp);
      }
    } else if (base.status?.timestamp) {
      statusTimestamp = base.status.timestamp instanceof Date
        ? base.status.timestamp
        : new Date(base.status.timestamp);
    }

    const statusData = status ? {
      doing: status.doing || base.status?.doing || '',
      location: status.location || base.status?.location || '',
      mood: status.mood || base.status?.mood || '',
      timestamp: statusTimestamp
    } : base.status || {};

    // Process achievements data - ALWAYS use database achievements
    // Map achievements to include completedAt status
    const achievementsData = achievements.map(achievement => ({
      ...achievement,
      completed: achievement.completedAt !== null
    }));

    // Process quests data - ALWAYS use database quests
    // Map quests to include completedAt status
    const questsData = quests.map(quest => ({
      ...quest,
      completed: quest.completedAt !== null
    }));

    // Process journals data - ALWAYS use database journals
    const journalsData = journals || [];

    return {
      ...base,
      name,
      caption,
      currentXP: Number.parseInt(profile?.currentXP, 10) || 0,
      level: Number.parseInt(profile?.level, 10) || 0,
      maxXP: Number.parseInt(profile?.maxXP, 10) || base.maxXP,
      skills,
      interests,
      introduce,
      social,
      status: statusData,
      achievements: achievementsData,
      quests: questsData,
      journal: journalsData,
      moodOptions: Array.isArray(config?.moodOptions) ? config.moodOptions : [],
      locationOptions: Array.isArray(config?.locationOptions) ? config.locationOptions : [],
    };
  } catch (error) {
    console.error('❌ Error in fetchCharacterViewData:', error);
    // Return base data with empty arrays on error
    return {
      ...base,
      achievements: [],
      quests: [],
      journal: []
    };
  }
};

export const saveStatus = async (statusData, characterId = CHARACTER_ID) => {
  try {
    // Fetch current status document to get its ID
    const currentStatus = await fetchStatus(characterId);

    if (!currentStatus || !currentStatus.id) {
      throw new Error('No status document found. Please create one first.');
    }

    // Build data object with only non-empty fields (merge behavior)
    const dataToSave = {};

    // doing: if provided, prepend to existing array (or convert to array) and save
    if (statusData.doing && statusData.doing.trim()) {
      const newDoing = statusData.doing.trim();
      const existingDoing = Array.isArray(currentStatus?.doing)
        ? currentStatus.doing
        : (currentStatus?.doing ? [currentStatus.doing] : []);
      const exists = existingDoing
        .map(d => String(d).trim().toLowerCase())
        .includes(newDoing.toLowerCase());
      if (!exists) {
        dataToSave.doing = [newDoing, ...existingDoing];
      }
    }

    if (statusData.location && statusData.location.trim()) {
      const newLocation = statusData.location.trim();
      const existingLocation = Array.isArray(currentStatus?.location)
        ? currentStatus.location
        : (currentStatus?.location ? [currentStatus.location] : []);
      const existsLoc = existingLocation
        .map(v => String(v).trim().toLowerCase())
        .includes(newLocation.toLowerCase());
      if (!existsLoc) {
        dataToSave.location = [newLocation, ...existingLocation];
      }
    }

    if (statusData.mood && statusData.mood.trim()) {
      dataToSave.mood = statusData.mood.trim();
    }

    // Always add timestamp
    dataToSave.timestamp = serverTimestamp();

    // Handle caption update to profile (separate from status)
    let captionUpdated = false;
    if (statusData.caption && statusData.caption.trim()) {
      try {
        const currentProfile = await fetchProfile(characterId);
        if (currentProfile && currentProfile.id) {
          const profileDocRef = doc(db, 'main', characterId, 'profile', currentProfile.id);
          await setDoc(profileDocRef, { caption: statusData.caption.trim() }, { merge: true });
          console.log('✅ Profile caption updated successfully');
          captionUpdated = true;
        }
      } catch (profileError) {
        console.error('⚠️ Error updating profile caption:', profileError);
        // Don't throw error, just log it since caption update is secondary
      }
    }

    // Save status data if there's at least one field besides timestamp
    const hasStatusData = Object.keys(dataToSave).length > 1;
    if (hasStatusData) {
      const statusDocRef = doc(db, 'main', characterId, 'status', currentStatus.id);
      await setDoc(statusDocRef, dataToSave, { merge: true });
    }

    // Return success if either caption or status data was updated
    if (captionUpdated || hasStatusData) {
      return { success: true, id: currentStatus.id, data: dataToSave };
    }

    console.warn('⚠️ No data to save (all fields empty)');
    return { success: false, message: 'No data to save' };

  } catch (error) {
    console.error('❌ Firestore Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const saveAchievement = async (achievementData, characterId = CHARACTER_ID) => {
  try {
    // Validate achievement name
    if (!achievementData.name || !achievementData.name.trim()) {
      throw new Error('Achievement name cannot be empty');
    }

    // Sanitize achievement name
    const sanitizedName = achievementData.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length to 50 characters

    if (!sanitizedName) {
      throw new Error('Achievement name must contain at least one alphanumeric character');
    }

    // Generate date suffix in YYMMDD format using Vietnam timezone (UTC+7)
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, ''); // Format: YYMMDD

    // Combine name with date: name_YYMMDD
    const achievementId = `${sanitizedName}_${dateSuffix}`;

    const dataToSave = {
      name: achievementData.name,
      desc: achievementData.desc,
      icon: achievementData.icon,
      xp: achievementData.xp,
      specialReward: achievementData.specialReward,
      dueDate: achievementData.dueDate,
      completedAt: null,
      createdAt: serverTimestamp()
    };

    // Use setDoc with achievement name + date as document ID
    const achievementDocRef = doc(db, 'main', characterId, 'achievements', achievementId);
    await setDoc(achievementDocRef, dataToSave);

    return { success: true, id: achievementId, data: dataToSave };

  } catch (error) {
    console.error('❌ Firestore Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const fetchAchievements = async (characterId = CHARACTER_ID) => {
  try {
    const achievementsRef = collection(db, 'main', characterId, 'achievements');
    const snapshot = await getDocs(achievementsRef);

    const achievements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return achievements;
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

export const updateAchievement = async (achievementId, achievementData, characterId = CHARACTER_ID) => {
  try {
    // Just update existing document, don't change ID
    // Achievement ID includes date suffix and should not be changed
    const achievementRef = doc(db, 'main', characterId, 'achievements', achievementId);

    // Get the old document to check if it exists
    const oldDoc = await getDoc(achievementRef);
    if (!oldDoc.exists()) {
      throw new Error('Achievement not found');
    }

    // Merge new data with existing document
    await setDoc(achievementRef, achievementData, { merge: true });

    return { success: true, id: achievementId, nameChanged: false };
  } catch (error) {
    console.error('❌ Error updating achievement:', error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const deleteAchievement = async (achievementId, characterId = CHARACTER_ID) => {
  try {
    const achievementRef = doc(db, 'main', characterId, 'achievements', achievementId);
    await deleteDoc(achievementRef);

    return { success: true, id: achievementId };
  } catch (error) {
    console.error('❌ Error deleting achievement:', error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

// ========================================
// Daily Quest Functions
// ========================================

export const saveQuest = async (questData, characterId = CHARACTER_ID) => {
  try {
    // Validate quest data
    if (!questData.name || !questData.name.trim()) {
      throw new Error('Quest name cannot be empty');
    }

    if (!questData.xp || questData.xp <= 0) {
      throw new Error('Quest XP must be greater than 0');
    }

    // Sanitize quest name
    const sanitizedName = questData.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length to 50 characters

    if (!sanitizedName) {
      throw new Error('Quest name must contain at least one alphanumeric character');
    }

    // Generate date suffix in YYMMDD format using Vietnam timezone (UTC+7)
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, ''); // Format: YYMMDD

    // Combine name with date: name_YYMMDD
    const questId = `${sanitizedName}_${dateSuffix}`;

    const dataToSave = {
      name: questData.name.trim(),
      desc: questData.desc?.trim() || '',
      xp: questData.xp,
      completedAt: null,
      createdAt: serverTimestamp()
    };

    const questDocRef = doc(db, 'main', characterId, 'quests', questId);
    await setDoc(questDocRef, dataToSave);

    return { success: true, id: questId, data: dataToSave };

  } catch (error) {
    console.error('❌ Firestore Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const fetchQuests = async (characterId = CHARACTER_ID) => {
  try {
    const questsRef = collection(db, 'main', characterId, 'quests');
    const snapshot = await getDocs(questsRef);

    const quests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return quests;
  } catch (error) {
    console.error('❌ Error fetching quests:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

export const updateQuest = async (questId, questData, characterId = CHARACTER_ID) => {
  try {
    const questRef = doc(db, 'main', characterId, 'quests', questId);
    await setDoc(questRef, questData, { merge: true });

    return { success: true, id: questId };
  } catch (error) {
    console.error('❌ Error updating quest:', error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const deleteQuest = async (questId, characterId = CHARACTER_ID) => {
  try {
    const questRef = doc(db, 'main', characterId, 'quests', questId);
    await deleteDoc(questRef);

    return { success: true, id: questId };
  } catch (error) {
    console.error('❌ Error deleting quest:', error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const fetchJournals = async (characterId = CHARACTER_ID) => {
  try {
    const journalsRef = collection(db, 'main', characterId, 'journal');
    const snapshot = await getDocs(journalsRef);

    const journals = snapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = new Date();

      // Handle Firestore Timestamp (note: DB uses 'createAt' typo)
      if (data.createAt) {
        if (typeof data.createAt.toDate === 'function') {
          timestamp = data.createAt.toDate();
        } else if (data.createAt instanceof Date) {
          timestamp = data.createAt;
        } else {
          timestamp = new Date(data.createAt);
        }
      }

      return {
        id: doc.id,
        entry: data.caption || '',
        time: timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        timestamp: timestamp,
        createdAt: data.createAt || timestamp // Include createdAt for filtering
      };
    });

    // Sort by timestamp descending (newest first)
    journals.sort((a, b) => b.timestamp - a.timestamp);

    return journals;
  } catch (error) {
    console.error('❌ Error fetching journals:', error);
    return [];
  }
};

export const saveJournal = async (journalData, characterId = CHARACTER_ID) => {
  try {
    // Validate journal content
    if (!journalData.caption || !journalData.caption.trim()) {
      throw new Error('Journal content cannot be empty');
    }

    // Generate datetime-based document ID using Vietnam timezone (UTC+7)
    const now = new Date();
    const datetimeId = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(' ', '_').replace(/:/g, '-'); // Format: YYYY-MM-DD_HH-MM-SS (Vietnam time)

    const dataToSave = {
      caption: journalData.caption.trim(),
      createAt: serverTimestamp() // Note: keeping original typo from DB schema
    };

    // Use setDoc with custom document ID instead of addDoc
    const journalDocRef = doc(db, 'main', characterId, 'journal', datetimeId);
    await setDoc(journalDocRef, dataToSave);

    // Update history collection with journal reference
    await updateTodayHistory(characterId, datetimeId);

    return { success: true, id: datetimeId, data: dataToSave };

  } catch (error) {
    console.error('❌ Firestore Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    throw new Error(`Firestore error: ${error.message}`);
  }
};

const updateTodayHistory = async (characterId, journalId) => {
  try {
    // Get today's date as document ID (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0];
    const journalPath = `/main/${characterId}/journal/${journalId}`;

    const historyRef = doc(db, 'main', characterId, 'history', today);

    // Check if history document exists for today
    const historySnap = await getDoc(historyRef);

    if (historySnap.exists()) {
      // Add to existing journals array
      const currentJournals = historySnap.data().journals || [];
      const updatedJournals = [...currentJournals, journalPath];

      await setDoc(historyRef, { journals: updatedJournals }, { merge: true });
    } else {
      // Create new history document
      await setDoc(historyRef, { journals: [journalPath] });
    }

  } catch (error) {
    console.error('❌ Error updating history:', error);
    // Don't throw error here - journal was saved successfully
  }
};

// ========================================
// Quest Confirmation Functions
// ========================================

/**
 * Save quest confirmation to Firestore
 * Document ID = quest name (sanitized) + date suffix (YYMMDD)
 * Follows same convention as saveQuest: name_YYMMDD
 * 
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.name - Quest name (used as document ID)
 * @param {string} confirmData.desc - Description of completion
 * @param {string} confirmData.imgUrl - Image URL from Storage
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const saveQuestConfirmation = async (confirmData, characterId = CHARACTER_ID) => {
  try {
    // Validate data
    if (!confirmData.name || !confirmData.name.trim()) {
      throw new Error('Quest name is required');
    }

    // Sanitize quest name for document ID (same as saveQuest)
    const sanitizedName = confirmData.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length to 50 characters

    if (!sanitizedName) {
      throw new Error('Quest name must contain at least one alphanumeric character');
    }

    // Generate date suffix in YYMMDD format using Vietnam timezone (UTC+7)
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, ''); // Format: YYMMDD

    // Combine name with date: name_YYMMDD (same as saveQuest)
    const docId = `${sanitizedName}_${dateSuffix}`;

    const dataToSave = {
      name: confirmData.name.trim(),
      desc: confirmData.desc?.trim() || '',
      imgUrl: confirmData.imgUrl || '',
      createdAt: serverTimestamp()
    };

    const confirmRef = doc(db, 'main', characterId, 'quests-confirm', docId);
    // setDoc will overwrite if document already exists (same quest submitted multiple times today)
    await setDoc(confirmRef, dataToSave);

    return { success: true, id: docId };

  } catch (error) {
    console.error('❌ Error saving quest confirmation:', error);
    throw new Error(`Failed to save quest confirmation: ${error.message}`);
  }
};

/**
 * Fetch all quest confirmations
 * 
 * @param {string} characterId - Character ID
 * @returns {Promise<Array>} Array of quest confirmations
 */
export const fetchQuestConfirmations = async (characterId = CHARACTER_ID) => {
  try {
    const confirmRef = collection(db, 'main', characterId, 'quests-confirm');
    const snapshot = await getDocs(confirmRef);

    const confirmations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return confirmations;

  } catch (error) {
    console.error('❌ Error fetching quest confirmations:', error);
    return [];
  }
};

/**
 * Get single quest confirmation by quest name and date
 * 
 * @param {string} questName - Quest name (will be sanitized to match document ID)
 * @param {string} characterId - Character ID
 * @returns {Promise<Object|null>} Quest confirmation data or null
 */
export const getQuestConfirmation = async (questName, characterId = CHARACTER_ID) => {
  try {
    const sanitizedName = questName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Generate today's date suffix
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const docId = `${sanitizedName}_${dateSuffix}`;

    const confirmRef = doc(db, 'main', characterId, 'quests-confirm', docId);
    const snapshot = await getDoc(confirmRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }

    return null;

  } catch (error) {
    console.error('❌ Error getting quest confirmation:', error);
    return null;
  }
};

/**
 * Delete quest confirmation
 * 
 * @param {string} questName - Quest name
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean}>}
 */
export const deleteQuestConfirmation = async (questName, characterId = CHARACTER_ID) => {
  try {
    const sanitizedName = questName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Generate today's date suffix
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const docId = `${sanitizedName}_${dateSuffix}`;

    const confirmRef = doc(db, 'main', characterId, 'quests-confirm', docId);
    await deleteDoc(confirmRef);

    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting quest confirmation:', error);
    throw new Error(`Failed to delete quest confirmation: ${error.message}`);
  }
};

// ========================================
// Achievement Confirmation Functions (for future use)
// ========================================

/**
 * Save achievement confirmation to Firestore
 * Document ID = achievement name (sanitized) + date suffix (YYMMDD)
 * Follows same convention as saveAchievement: name_YYMMDD
 * 
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.name - Achievement name
 * @param {string} confirmData.desc - Description
 * @param {string} confirmData.imgUrl - Image URL
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const saveAchievementConfirmation = async (confirmData, characterId = CHARACTER_ID) => {
  try {
    // Sanitize achievement name
    const sanitizedName = confirmData.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    if (!sanitizedName) {
      throw new Error('Achievement name must contain at least one alphanumeric character');
    }

    // Generate date suffix in YYMMDD format using Vietnam timezone (UTC+7)
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    // Combine name with date: name_YYMMDD
    const docId = `${sanitizedName}_${dateSuffix}`;

    const dataToSave = {
      name: confirmData.name.trim(),
      desc: confirmData.desc?.trim() || '',
      imgUrl: confirmData.imgUrl || '',
      createdAt: serverTimestamp()
    };

    const confirmRef = doc(db, 'main', characterId, 'achievements-confirm', docId);
    await setDoc(confirmRef, dataToSave);

    return { success: true, id: docId };

  } catch (error) {
    console.error('❌ Error saving achievement confirmation:', error);
    throw new Error(`Failed to save achievement confirmation: ${error.message}`);
  }
};


/**
 * Delete quest confirmation by document ID
 * 
 * @param {string} confirmationId - Confirmation document ID
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean}>}
 */
export const deleteQuestConfirmationById = async (confirmationId, characterId = CHARACTER_ID) => {
  try {
    const confirmRef = doc(db, 'main', characterId, 'quests-confirm', confirmationId);
    await deleteDoc(confirmRef);

    console.log('✅ Quest confirmation deleted by ID:', confirmationId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting quest confirmation by ID:', error);
    throw new Error(`Failed to delete quest confirmation: ${error.message}`);
  }
};

/**
 * Fetch all achievement confirmations
 * 
 * @param {string} characterId - Character ID
 * @returns {Promise<Array>} Array of achievement confirmations
 */
export const fetchAchievementConfirmations = async (characterId = CHARACTER_ID) => {
  try {
    const confirmRef = collection(db, 'main', characterId, 'achievements-confirm');
    const snapshot = await getDocs(confirmRef);

    const confirmations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return confirmations;

  } catch (error) {
    console.error('❌ Error fetching achievement confirmations:', error);
    return [];
  }
};

/**
 * Get single achievement confirmation by achievement name and date
 * 
 * @param {string} achievementName - Achievement name (will be sanitized to match document ID)
 * @param {string} characterId - Character ID
 * @returns {Promise<Object|null>} Achievement confirmation data or null
 */
export const getAchievementConfirmation = async (achievementName, characterId = CHARACTER_ID) => {
  try {
    const sanitizedName = achievementName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Generate today's date suffix
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const docId = `${sanitizedName}_${dateSuffix}`;

    const confirmRef = doc(db, 'main', characterId, 'achievements-confirm', docId);
    const snapshot = await getDoc(confirmRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }

    return null;

  } catch (error) {
    console.error('❌ Error getting achievement confirmation:', error);
    return null;
  }
};

/**
 * Delete achievement confirmation
 * 
 * @param {string} achievementName - Achievement name
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean}>}
 */
export const deleteAchievementConfirmation = async (achievementName, characterId = CHARACTER_ID) => {
  try {
    const sanitizedName = achievementName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Generate today's date suffix
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const docId = `${sanitizedName}_${dateSuffix}`;

    const confirmRef = doc(db, 'main', characterId, 'achievements-confirm', docId);
    await deleteDoc(confirmRef);

    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting achievement confirmation:', error);
    throw new Error(`Failed to delete achievement confirmation: ${error.message}`);
  }
};

/**
 * Delete achievement confirmation by document ID
 * 
 * @param {string} confirmationId - Confirmation document ID
 * @param {string} characterId - Character ID
 * @returns {Promise<{success: boolean}>}
 */
export const deleteAchievementConfirmationById = async (confirmationId, characterId = CHARACTER_ID) => {
  try {
    const confirmRef = doc(db, 'main', characterId, 'achievements-confirm', confirmationId);
    await deleteDoc(confirmRef);

    console.log('✅ Achievement confirmation deleted by ID:', confirmationId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting achievement confirmation by ID:', error);
    throw new Error(`Failed to delete achievement confirmation: ${error.message}`);
  }
};
