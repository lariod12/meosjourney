import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const CHARACTER_ID = import.meta.env.VITE_CHARACTER_ID || 'qA5WkN2rIGKGhMSvTwYj';

export const fetchFirstDocData = async (colPath) => {
  const snap = await getDocs(collection(db, ...colPath));
  const first = snap.docs[0];
  return first ? { id: first.id, ...first.data() } : null;
};

export const fetchProfile = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'profile']);
};

export const fetchConfig = async (characterId = CHARACTER_ID) => {
  return await fetchFirstDocData(['main', characterId, 'config']);
};

export const fetchCharacterViewData = async (characterId = CHARACTER_ID, base = {}) => {
  const [profile, config] = await Promise.all([fetchProfile(characterId), fetchConfig(characterId)]);

  const skills = Array.isArray(profile?.skills) ? profile.skills.map((n) => ({ name: n })) : base.skills || [];
  const interests = Array.isArray(profile?.interests) ? profile.interests.map((n) => ({ name: n })) : base.interests || [];
  const introduce = typeof profile?.introduce === 'string' && profile.introduce.trim() ? profile.introduce : base.introduce || '';
  const name = typeof profile?.name === 'string' && profile.name.trim() ? profile.name : base.name;
  const caption = typeof profile?.caption === 'string' && profile.caption.trim() ? profile.caption : base.caption;

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
    moodOptions: Array.isArray(config?.moodOptions) ? config.moodOptions : [],
    locationOptions: Array.isArray(config?.locationOptions) ? config.locationOptions : [],
  };
};
