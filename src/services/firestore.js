import { collection, getDocs, doc, setDoc, serverTimestamp, getDocsFromServer } from 'firebase/firestore';
import { db } from './firebase';

export const CHARACTER_ID = import.meta.env.VITE_CHARACTER_ID || 'qA5WkN2rIGKGhMSvTwYj';

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
