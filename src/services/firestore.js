import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, getDocsFromServer, deleteDoc, getDoc } from 'firebase/firestore';
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

export const fetchConfig = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'config']);
};

export const fetchStatus = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'status']);
};

export const fetchCharacterViewData = async (characterId = CHARACTER_ID, base = {}) => {
  const [profile, config, status] = await Promise.all([
    fetchProfile(characterId), 
    fetchConfig(characterId),
    fetchStatus(characterId)
  ]);

  const skills = Array.isArray(profile?.skills) ? profile.skills.map((n) => ({ name: n })) : base.skills || [];
  const interests = Array.isArray(profile?.interests) ? profile.interests.map((n) => ({ name: n })) : base.interests || [];
  const introduce = typeof profile?.introduce === 'string' && profile.introduce.trim() ? profile.introduce : base.introduce || '';
  const name = typeof profile?.name === 'string' && profile.name.trim() ? profile.name : base.name;
  const caption = typeof profile?.caption === 'string' && profile.caption.trim() ? profile.caption : base.caption;

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

  return {
    ...base,
    name,
    caption,
    currentXP: Number.parseInt(profile?.currentXP, 10) || 0,
    level: Number.parseInt(profile?.level, 10) || 0,
    maxXP: typeof config?.maxXP === 'number' ? config.maxXP : base.maxXP,
    skills,
    interests,
    introduce,
    status: statusData,
    moodOptions: Array.isArray(config?.moodOptions) ? config.moodOptions : [],
    locationOptions: Array.isArray(config?.locationOptions) ? config.locationOptions : [],
  };
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
    
    if (statusData.doing && statusData.doing.trim()) {
      dataToSave.doing = statusData.doing.trim();
    }
    
    if (statusData.location && statusData.location.trim()) {
      dataToSave.location = statusData.location.trim();
    }
    
    if (statusData.mood && statusData.mood.trim()) {
      dataToSave.mood = statusData.mood.trim();
    }
    
    // Always add timestamp
    dataToSave.timestamp = serverTimestamp();
    
    console.log('💾 Attempting to merge status:', dataToSave);
    console.log('📍 Document: main/' + characterId + '/status/' + currentStatus.id);
    
    // Only save if there's at least one field besides timestamp
    if (Object.keys(dataToSave).length > 1) {
      const statusDocRef = doc(db, 'main', characterId, 'status', currentStatus.id);
      await setDoc(statusDocRef, dataToSave, { merge: true });
      
      console.log('✅ Status merged successfully to:', currentStatus.id);
      
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
    const dataToSave = {
      name: achievementData.name,
      desc: achievementData.desc,
      icon: achievementData.icon,
      xp: achievementData.xp,
      specialReward: achievementData.specialReward,
      dueDate: achievementData.dueDate,
      completed: false,
      completedAt: null,
      createdAt: serverTimestamp()
    };
    
    console.log('💾 Creating achievement:', dataToSave);
    console.log('📍 Collection: main/' + characterId + '/achievements');
    
    const achievementsRef = collection(db, 'main', characterId, 'achievements');
    const docRef = await addDoc(achievementsRef, dataToSave);
    
    console.log('✅ Achievement created with ID:', docRef.id);
    
    return { success: true, id: docRef.id, data: dataToSave };
    
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
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const updateAchievement = async (achievementId, achievementData, characterId = CHARACTER_ID) => {
  try {
    const achievementRef = doc(db, 'main', characterId, 'achievements', achievementId);
    await setDoc(achievementRef, achievementData, { merge: true });
    
    console.log('✅ Achievement updated:', achievementId);
    return { success: true, id: achievementId };
  } catch (error) {
    console.error('❌ Error updating achievement:', error);
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const deleteAchievement = async (achievementId, characterId = CHARACTER_ID) => {
  try {
    const achievementRef = doc(db, 'main', characterId, 'achievements', achievementId);
    await deleteDoc(achievementRef);
    
    console.log('✅ Achievement deleted:', achievementId);
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
    if (!questData.title || !questData.title.trim()) {
      throw new Error('Quest title cannot be empty');
    }

    if (!questData.xp || questData.xp <= 0) {
      throw new Error('Quest XP must be greater than 0');
    }

    // Generate datetime-based document ID using Vietnam timezone (UTC+7) - same as journal
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
      title: questData.title.trim(),
      xp: questData.xp,
      completed: false,
      completedAt: null,
      createdAt: serverTimestamp()
    };
    
    console.log('💾 Creating quest with Vietnam timezone ID:', datetimeId);
    console.log('⚔️ Data:', dataToSave);
    console.log('📍 Document: main/' + characterId + '/quests/' + datetimeId);
    console.log('🕐 Vietnam time (UTC+7):', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    // Use setDoc with custom document ID instead of addDoc
    const questDocRef = doc(db, 'main', characterId, 'quests', datetimeId);
    await setDoc(questDocRef, dataToSave);
    
    console.log('✅ Quest created with Vietnam timezone ID:', datetimeId);
    
    return { success: true, id: datetimeId, data: dataToSave };
    
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
    throw new Error(`Firestore error: ${error.message}`);
  }
};

export const updateQuest = async (questId, questData, characterId = CHARACTER_ID) => {
  try {
    const questRef = doc(db, 'main', characterId, 'quests', questId);
    await setDoc(questRef, questData, { merge: true });
    
    console.log('✅ Quest updated:', questId);
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
    
    console.log('✅ Quest deleted:', questId);
    return { success: true, id: questId };
  } catch (error) {
    console.error('❌ Error deleting quest:', error);
    throw new Error(`Firestore error: ${error.message}`);
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
    
    console.log('💾 Creating journal entry with Vietnam timezone ID:', datetimeId);
    console.log('📝 Data:', dataToSave);
    console.log('📍 Document: main/' + characterId + '/journal/' + datetimeId);
    console.log('🕐 Vietnam time (UTC+7):', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    // Use setDoc with custom document ID instead of addDoc
    const journalDocRef = doc(db, 'main', characterId, 'journal', datetimeId);
    await setDoc(journalDocRef, dataToSave);
    
    console.log('✅ Journal entry created with Vietnam timezone ID:', datetimeId);
    
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
    
    console.log('📅 Updating history for date:', today);
    console.log('📝 Adding journal path:', journalPath);
    
    const historyRef = doc(db, 'main', characterId, 'history', today);
    
    // Check if history document exists for today
    const historySnap = await getDoc(historyRef);
    
    if (historySnap.exists()) {
      // Add to existing journals array
      const currentJournals = historySnap.data().journals || [];
      const updatedJournals = [...currentJournals, journalPath];
      
      await setDoc(historyRef, { journals: updatedJournals }, { merge: true });
      console.log('✅ Updated existing history document');
    } else {
      // Create new history document
      await setDoc(historyRef, { journals: [journalPath] });
      console.log('✅ Created new history document');
    }
    
  } catch (error) {
    console.error('❌ Error updating history:', error);
    // Don't throw error here - journal was saved successfully
  }
};
