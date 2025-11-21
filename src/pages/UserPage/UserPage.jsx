import { useState, useEffect, useRef } from 'react';
import './UserPage.css';

// NocoDB imports for read and write operations
import { fetchConfig, fetchProfile, fetchStatus, updateProfile, saveStatus, saveJournal, fetchQuests, fetchQuestConfirmations, fetchAchievements, fetchAchievementConfirmations, saveQuestConfirmation } from '../../services/nocodb';

// TODO: Migrate to NocoDB - these Firestore functions need to be replaced
// Fetch functions removed - will use NocoDB hooks instead
// import {
//   fetchStatus,
//   fetchProfile,
//   fetchQuests,
//   fetchQuestConfirmations,
//   fetchAchievements,
//   fetchAchievementConfirmations,
// } from '../../services/firestore';

// Write operations still using Firestore (need migration)
import {
  saveProfile,
  getQuestConfirmation,
  saveAchievementConfirmation,
  getAchievementConfirmation,
  updateQuest,
  updateAchievement,
  updateProfileXP,
  CHARACTER_ID
} from '../../services/firestore';
import { saveQuestCompletionJournal, saveAchievementCompletionJournal, saveStatusChangeJournal, saveProfileChangeJournal } from '../../utils/questJournalUtils';
import { clearCache } from '../../utils/cacheManager';
import { uploadQuestConfirmImage, uploadAchievementConfirmImage, deleteImageByUrl } from '../../services/storage';
import { sendQuestSubmissionNotification, sendAchievementNotification, sendAdminQuestCompletedNotification, sendAdminAchievementCompletedNotification, sendLevelUpNotification } from '../../services/discord';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import IconRenderer from '../../components/IconRenderer/IconRenderer';

const SESSION_KEY = 'meos05_access';

const UserPage = ({ onBack }) => {
  const [existingMoods, setExistingMoods] = useState([]);
  const [moodSuggestions, setMoodSuggestions] = useState([]);
  const [existingDoings, setExistingDoings] = useState([]);
  const [doingSuggestions, setDoingSuggestions] = useState([]);
  const [doingOpen, setDoingOpen] = useState(false);
  const [existingLocations, setExistingLocations] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [correctPassword, setCorrectPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    noteDate: new Date().toISOString().split('T')[0],
    doing: '',
    location: '',
    caption: '',
    mood: '',
    journalEntry: '',
    introduce: '',
    newSkill: '',
    newHobby: ''
  });

  // Profile data states
  // Note: 'Hobbys' in UI maps to 'hobbies' field in NocoDB profile table
  const [profileData, setProfileData] = useState({
    introduce: '',
    skills: [],
    hobbies: [] // Maps to 'hobbies' in NocoDB
  });
  const [originalProfileData, setOriginalProfileData] = useState({
    introduce: '',
    skills: [],
    hobbies: []
  });
  const [originalStatusData, setOriginalStatusData] = useState({
    doing: '',
    location: '',
    mood: '',
    caption: ''
  });
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Daily Quests Update states
  const [availableQuests, setAvailableQuests] = useState([]);
  const [allQuests, setAllQuests] = useState([]); // Tất cả quests (bao gồm completed)
  const [questConfirmations, setQuestConfirmations] = useState([]);
  const [selectedQuestSubmissions, setSelectedQuestSubmissions] = useState([]);
  const [expandedQuestSubmissions, setExpandedQuestSubmissions] = useState([]); // Track expanded quest forms
  const [showQuestDropdown, setShowQuestDropdown] = useState(false);
  const questDropdownRef = useRef(null);

  // Achievements Update states
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]); // Tất cả achievements (bao gồm completed)
  const [achievementConfirmations, setAchievementConfirmations] = useState([]);
  const [selectedAchievementSubmissions, setSelectedAchievementSubmissions] = useState([]);
  const [expandedAchievementSubmissions, setExpandedAchievementSubmissions] = useState([]); // Track expanded achievement forms
  const [showAchievementDropdown, setShowAchievementDropdown] = useState(false);
  const achievementDropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingQuestIndex, setUploadingQuestIndex] = useState(-1);
  const [autoApproveTasks, setAutoApproveTasks] = useState(false);
  const [questPickerCollapsed, setQuestPickerCollapsed] = useState(false);
  const [achievementPickerCollapsed, setAchievementPickerCollapsed] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
    canClose: true
  });

  const moodRef = useRef(null);
  const doingRef = useRef(null);
  const locationRef = useRef(null);
  const [moodOpen, setMoodOpen] = useState(false);

  // Collapse/expand states - collapsed by default
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);

  // Review submitted visibility state - hidden by default
  const [reviewSubmittedExpanded, setReviewSubmittedExpanded] = useState(false);

  // Individual group collapse/expand states - collapsed by default
  const [pendingGroupExpanded, setPendingGroupExpanded] = useState(false);
  const [failedGroupExpanded, setFailedGroupExpanded] = useState(false);
  const [completedGroupExpanded, setCompletedGroupExpanded] = useState(false);

  const normalizeStatusValue = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const str = typeof item === 'string' ? item.trim() : String(item || '').trim();
        if (str) return str;
      }
      return '';
    }
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
  };

  const resolveLocalizedValue = (value, fallback = '') => {
    if (!value && value !== 0) {
      return typeof fallback === 'string' ? fallback : '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const { en, vi, ...rest } = value;

      if (typeof en === 'string' && en.trim()) {
        return en.trim();
      }

      if (typeof vi === 'string' && vi.trim()) {
        return vi.trim();
      }

      const firstString = Object.values(rest).find(
        entry => typeof entry === 'string' && entry.trim()
      );

      if (firstString) {
        return firstString.trim();
      }
    }

    if (Array.isArray(value)) {
      const firstString = value.find(entry => typeof entry === 'string' && entry.trim());
      if (firstString) {
        return firstString.trim();
      }
    }

    return typeof fallback === 'string' ? fallback : '';
  };

  const getLocalizedName = (item) => resolveLocalizedValue(item?.nameTranslations, item?.name);
  const getLocalizedDesc = (item) => resolveLocalizedValue(item?.descTranslations, item?.desc);
  const getLocalizedReward = (item) => resolveLocalizedValue(item?.specialRewardTranslations, item?.specialReward);

  const applyStatusProfileToForm = (statusData, profile) => {
    setFormData(prev => {
      const next = { ...prev };

      if (profile) {
        next.introduce = profile.introduce || '';
        next.caption = typeof profile.caption === 'string' ? profile.caption : '';
      }

      if (statusData) {
        next.doing = normalizeStatusValue(statusData.doing);
        next.location = normalizeStatusValue(statusData.location);
        next.mood = normalizeStatusValue(statusData.mood);
      }

      return next;
    });
  };

  const resetUserPageState = async () => {
    setFormData(prev => ({
      ...prev,
      doing: '',
      location: '',
      mood: '',
      journalEntry: '',
      newSkill: '',
      newHobby: ''
    }));
    setDoingSuggestions([]);
    setDoingOpen(false);
    setLocationSuggestions([]);
    setLocationOpen(false);
    setMoodSuggestions([]);
    setMoodOpen(false);
    setSelectedQuestSubmissions([]);
    setSelectedAchievementSubmissions([]);
    setExpandedQuestSubmissions([]);
    setExpandedAchievementSubmissions([]);

    // TODO: Migrate to NocoDB - Temporarily commented out Firestore data refresh
    /* 
    try {
      const [statusData2, profile2, quests, questConfirms, achievements, achievementConfirms] = await Promise.all([
        fetchStatus(CHARACTER_ID),
        fetchProfile(CHARACTER_ID),
        fetchQuests(CHARACTER_ID),
        fetchQuestConfirmations(CHARACTER_ID),
        fetchAchievements(CHARACTER_ID),
        fetchAchievementConfirmations(CHARACTER_ID)
      ]);

      applyStatusProfileToForm(statusData2, profile2);
      setFormData(prev => ({
        ...prev,
        journalEntry: '',
        newSkill: '',
        newHobby: ''
      }));

      const doingsArr2 = Array.isArray(statusData2?.doing)
        ? statusData2.doing
        : (statusData2?.doing ? [statusData2.doing] : []);
      const seenDoings = new Set();
      const normalizedDoings = [];
      doingsArr2.forEach((d) => {
        const s = String(d).trim();
        const key = s.toLowerCase();
        if (s && !seenDoings.has(key)) { seenDoings.add(key); normalizedDoings.push(s); }
      });
      setExistingDoings(normalizedDoings);

      const locArr2 = Array.isArray(statusData2?.location)
        ? statusData2.location
        : (statusData2?.location ? [statusData2.location] : []);
      const seenLoc2 = new Set();
      const normalizedLocs2 = [];
      locArr2.forEach((l) => {
        const s = String(l).trim();
        const key = s.toLowerCase();
        if (s && !seenLoc2.has(key)) { seenLoc2.add(key); normalizedLocs2.push(s); }
      });
      setExistingLocations(normalizedLocs2);

      const moodArr2 = Array.isArray(statusData2?.mood)
        ? statusData2.mood
        : (statusData2?.mood ? [statusData2.mood] : []);
      const seenMood2 = new Set();
      const normalizedMoods2 = [];
      moodArr2.forEach((m) => {
        const s = String(m).trim();
        const key = s.toLowerCase();
        if (s && !seenMood2.has(key)) { seenMood2.add(key); normalizedMoods2.push(s); }
      });
      setExistingMoods(normalizedMoods2);

      if (profile2) {
        const updatedSkills = Array.isArray(profile2.skills) ? profile2.skills : [];
        const updatedhobbies = Array.isArray(profile2.hobbies) ? profile2.hobbies : [];

        setProfileData({
          introduce: profile2.introduce || '',
          skills: [...updatedSkills],
          hobbies: [...updatedhobbies]
        });

      } else {
        setProfileData({ introduce: '', skills: [], hobbies: [] });
      }

      setAllQuests(quests);
      setAvailableQuests(quests.filter(q => q.completedAt === null));
      setQuestConfirmations(questConfirms);

      setAllAchievements(achievements);
      setAvailableAchievements(achievements.filter(a => a.completedAt === null));
      setAchievementConfirmations(achievementConfirms);
    } catch (error) {
      console.error('⚠️ Failed to refresh data after submission:', error);
    }
    */
  };

  useEffect(() => {
    // Load config, profile, and status from NocoDB
    const loadData = async () => {
      try {
        // Fetch config, profile, and status from NocoDB service
        // Using sequential calls instead of Promise.all to avoid rate limiting
        const cfg = await fetchConfig();
        const profile = await fetchProfile();
        const statusData = await fetchStatus();

        // Load config data
        if (cfg) {
          setAutoApproveTasks(!!cfg.autoApproveTasks);
          setCorrectPassword(cfg.pwDailyUpdate || null);
          console.log('✅ Config loaded from NocoDB:', cfg);
        } else {
          setCorrectPassword(null);
          console.warn('⚠️ No config found in NocoDB');
        }

        // Load profile data (hobbies -> Hobbys mapping)
        if (profile) {
          const loadedSkills = Array.isArray(profile.skills) ? profile.skills : [];
          const loadedHobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];

          const loadedProfile = {
            introduce: profile.introduce || '',
            caption: profile.caption || '',
            skills: [...loadedSkills],
            hobbies: [...loadedHobbies]
          };

          setProfileData(loadedProfile);
          setOriginalProfileData(JSON.parse(JSON.stringify(loadedProfile))); // Deep copy for comparison

          console.log('✅ Profile loaded from NocoDB:', {
            introduce: profile.introduce,
            skills: loadedSkills.length,
            hobbies: loadedHobbies.length
          });
        } else {
          setProfileData({ introduce: '', skills: [], hobbies: [] });
          setOriginalProfileData({ introduce: '', skills: [], hobbies: [] });
          console.warn('⚠️ No profile found in NocoDB');
        }

        // Load status data and apply to form
        if (statusData) {
          // Prepare existing doings from status (array)
          const doingsArr = Array.isArray(statusData.doing) ? statusData.doing : [];
          const seen = new Set();
          const normalized = [];
          doingsArr.forEach((d) => {
            const s = String(d).trim();
            const key = s.toLowerCase();
            if (s && !seen.has(key)) { seen.add(key); normalized.push(s); }
          });
          setExistingDoings(normalized);

          // Prepare existing locations from status (array)
          const locArr = Array.isArray(statusData.location) ? statusData.location : [];
          const seenLoc = new Set();
          const normalizedLocs = [];
          locArr.forEach((l) => {
            const s = String(l).trim();
            const key = s.toLowerCase();
            if (s && !seenLoc.has(key)) { seenLoc.add(key); normalizedLocs.push(s); }
          });
          setExistingLocations(normalizedLocs);

          // Prepare existing moods from status (array) - using 'mood' not 'moods'
          const moodArr = Array.isArray(statusData.mood) ? statusData.mood : [];
          const seenMood = new Set();
          const normalizedMoods = [];
          moodArr.forEach((m) => {
            const s = String(m).trim();
            const key = s.toLowerCase();
            if (s && !seenMood.has(key)) { seenMood.add(key); normalizedMoods.push(s); }
          });
          setExistingMoods(normalizedMoods);

          // Save original status data for comparison
          const originalStatus = {
            doing: normalizeStatusValue(statusData.doing),
            location: normalizeStatusValue(statusData.location),
            mood: normalizeStatusValue(statusData.mood),
            caption: profile?.caption || ''
          };
          setOriginalStatusData(originalStatus);

          // Apply status and profile to form
          setFormData(prev => ({
            ...prev,
            doing: originalStatus.doing,
            location: originalStatus.location,
            mood: originalStatus.mood,
            caption: originalStatus.caption,
            introduce: profile?.introduce || ''
          }));

          console.log('✅ Status loaded from NocoDB:', {
            doing: normalized.length,
            location: normalizedLocs.length,
            mood: normalizedMoods.length
          });
        } else {
          setOriginalStatusData({ doing: '', location: '', mood: '', caption: '' });
          console.warn('⚠️ No status found in NocoDB');
        }

        setProfileLoaded(true);
      } catch (error) {
        console.error('❌ Error loading data from NocoDB:', error);
        setCorrectPassword(null);
        setProfileData({ introduce: '', skills: [], hobbies: [] });
        setProfileLoaded(true);
      }

      // Load quests and achievements from NocoDB
      try {
        console.log('📥 Loading quests and achievements from NocoDB...');
        const [questsData, questConfirmsData, achievementsData, achievementConfirmsData] = await Promise.all([
          fetchQuests(),
          fetchQuestConfirmations(),
          fetchAchievements(),
          fetchAchievementConfirmations()
        ]);

        // Filter available quests (not completed)
        const availableQuestsData = questsData.filter(q => q.completedAt === null);
        setAllQuests(questsData);
        setAvailableQuests(availableQuestsData);
        setQuestConfirmations(questConfirmsData);

        // Filter available achievements (not completed)
        const availableAchievementsData = achievementsData.filter(a => a.completedAt === null);
        setAllAchievements(achievementsData);
        setAvailableAchievements(availableAchievementsData);
        setAchievementConfirmations(achievementConfirmsData);

        console.log(`✅ Loaded ${questsData.length} quests (${availableQuestsData.length} available) and ${achievementsData.length} achievements (${availableAchievementsData.length} available)`);
      } catch (error) {
        console.error('❌ Error loading quests/achievements from NocoDB:', error);
        setAllQuests([]);
        setAvailableQuests([]);
        setQuestConfirmations([]);
        setAllAchievements([]);
        setAvailableAchievements([]);
        setAchievementConfirmations([]);
      }
    };

    loadData();
  }, []);

  // Refresh data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    setIsRefreshing(true);

    // TODO: Migrate to NocoDB - Temporarily commented out Firestore data refresh
    /* 
    try {
      const [cfg, statusData, profile, quests, questConfirms, achievements, achievementConfirms] = await Promise.all([
        fetchConfig(CHARACTER_ID),
        fetchStatus(CHARACTER_ID),
        fetchProfile(CHARACTER_ID),
        fetchQuests(CHARACTER_ID),
        fetchQuestConfirmations(CHARACTER_ID),
        fetchAchievements(CHARACTER_ID),
        fetchAchievementConfirmations(CHARACTER_ID)
      ]);

      setAutoApproveTasks(!!cfg?.auto_approve_tasks);

      // Update profile data
      if (profile) {
        const refreshedSkills = Array.isArray(profile.skills) ? profile.skills : [];
        const refreshedhobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];
        
        setProfileData({
          introduce: profile.introduce || '',
          skills: [...refreshedSkills], // Create new array to ensure reactivity
          hobbies: [...refreshedhobbies] // Create new array to ensure reactivity
        });
      }

      const doingsArr = Array.isArray(statusData?.doing)
        ? statusData.doing
        : (statusData?.doing ? [statusData.doing] : []);
      const seen = new Set();
      const normalized = [];
      doingsArr.forEach((d) => {
        const s = String(d).trim();
        const key = s.toLowerCase();
        if (s && !seen.has(key)) { seen.add(key); normalized.push(s); }
      });
      setExistingDoings(normalized);

      const locArr = Array.isArray(statusData?.location)
        ? statusData.location
        : (statusData?.location ? [statusData.location] : []);
      const seenLoc = new Set();
      const normalizedLocs = [];
      locArr.forEach((l) => {
        const s = String(l).trim();
        const key = s.toLowerCase();
        if (s && !seenLoc.has(key)) { seenLoc.add(key); normalizedLocs.push(s); }
      });
      setExistingLocations(normalizedLocs);

      const moodArr = Array.isArray(statusData?.mood)
        ? statusData.mood
        : (statusData?.mood ? [statusData.mood] : []);
      const seenMood = new Set();
      const normalizedMoods = [];
      moodArr.forEach((m) => {
        const s = String(m).trim();
        const key = s.toLowerCase();
        if (s && !seenMood.has(key)) { seenMood.add(key); normalizedMoods.push(s); }
      });
      setExistingMoods(normalizedMoods);

      // Store all and filter incomplete quests
      setAllQuests(quests);
      const availableQuests = quests.filter(q => q.completedAt === null);
      setAvailableQuests(availableQuests);
      setQuestConfirmations(questConfirms);

      // Store all and filter incomplete achievements
      setAllAchievements(achievements);
      const availableAchievements = achievements.filter(a => a.completedAt === null);
      setAvailableAchievements(availableAchievements);
      setAchievementConfirmations(achievementConfirms);

      applyStatusProfileToForm(statusData, profile);

      // Show success notification
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Refreshed',
        message: 'Data updated successfully!',
        confirmText: 'OK',
        cancelText: null, // No cancel button for success
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });

    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Refresh Failed',
        message: `Failed to refresh data: ${error.message}`,
        confirmText: 'OK',
        cancelText: null, // No cancel button for error
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsRefreshing(false);
    }
    */

    // Temporary: Show info that refresh is disabled
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: 'Refresh Disabled',
      message: 'Data refresh is temporarily disabled during NocoDB migration.',
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });

    setIsRefreshing(false);
  };

  useEffect(() => {
    // Wait until password is loaded from config
    if (correctPassword === null) return;

    // Check if already authenticated
    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
      setIsAuthenticated(true);
      return;
    }

    // Show password modal
    setShowPasswordModal(true);
  }, [correctPassword]);

  const handlePasswordSubmit = (password) => {
    if (password === correctPassword) {
      sessionStorage.setItem(SESSION_KEY, 'granted');
      setIsAuthenticated(true);
      setShowPasswordModal(false);
    } else {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Access Denied',
        message: 'Incorrect password. Please try again.',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setShowPasswordModal(false);
          if (onBack) onBack();
        }
      });
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    if (onBack) onBack();
  };



  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moodRef.current && !moodRef.current.contains(e.target)) {
        setMoodOpen(false);
      }
      if (doingRef.current && !doingRef.current.contains(e.target)) {
        setDoingOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (questDropdownRef.current && !questDropdownRef.current.contains(e.target)) {
        setShowQuestDropdown(false);
      }
      if (achievementDropdownRef.current && !achievementDropdownRef.current.contains(e.target)) {
        setShowAchievementDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const updateDoingSuggestions = (value) => {
    const q = String(value || '').trim().toLowerCase();
    if (!q) {
      setDoingSuggestions([]);
      setDoingOpen(false);
      return;
    }
    const suggestions = existingDoings.filter(d => d.toLowerCase().includes(q) || d.toLowerCase().startsWith(q));
    setDoingSuggestions(suggestions.slice(0, 10));
    setDoingOpen(suggestions.length > 0);
  };

  const updateLocationSuggestions = (value) => {
    const q = String(value || '').trim().toLowerCase();
    const pool = Array.isArray(existingLocations) ? existingLocations : [];
    if (!q) {
      setLocationSuggestions(pool.slice(0, 10));
      return;
    }
    const suggestions = pool.filter(l => l.toLowerCase().includes(q) || l.toLowerCase().startsWith(q));
    setLocationSuggestions(suggestions.slice(0, 10));
    setLocationOpen(suggestions.length > 0);
  };

  const openLocationDropdown = () => {
    // Show all available options on focus/click
    const pool = Array.isArray(existingLocations) ? existingLocations : [];
    const list = pool.slice(0, 10);
    setLocationSuggestions(list);
    setLocationOpen(list.length > 0);
  };

  const updateMoodSuggestions = (value) => {
    const q = String(value || '').trim().toLowerCase();
    const pool = Array.isArray(existingMoods) ? existingMoods : [];

    if (!q) {
      setMoodSuggestions(pool.slice(0, 10));
      return;
    }
    const suggestions = pool.filter(m => m.toLowerCase().includes(q) || m.toLowerCase().startsWith(q));
    setMoodSuggestions(suggestions.slice(0, 10));
    setMoodOpen(suggestions.length > 0);
  };

  const openMoodDropdown = () => {
    // Show all available options on focus/click
    const pool = Array.isArray(existingMoods) ? existingMoods : [];
    const list = pool.slice(0, 10);
    setMoodSuggestions(list);
    setMoodOpen(list.length > 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'doing') {
      updateDoingSuggestions(value);
    }
    if (name === 'location') {
      updateLocationSuggestions(value);
    }
    if (name === 'mood') {
      updateMoodSuggestions(value);
    }
  };

  // Profile handlers
  const handleAddSkill = async () => {
    const skill = formData.newSkill.trim();
    if (skill && !profileData.skills.includes(skill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setFormData(prev => ({ ...prev, newSkill: '' }));
      console.log('➕ Added skill:', skill, '| Current skills:', [...profileData.skills, skill]);

      // Save journal entry for skill addition
      try {
        await saveProfileChangeJournal('added', 'skill', skill, CHARACTER_ID);
      } catch (journalError) {
        console.warn('⚠️ Failed to save skill addition journal:', journalError);
      }
    } else if (skill && profileData.skills.includes(skill)) {
      console.log('⚠️ Skill already exists:', skill);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
    console.log('➖ Removed skill:', skillToRemove);

    // Save journal entry for skill removal
    try {
      await saveProfileChangeJournal('removed', 'skill', skillToRemove, CHARACTER_ID);
    } catch (journalError) {
      console.warn('⚠️ Failed to save skill removal journal:', journalError);
    }
  };

  const handleAddHobby = async () => {
    const hobby = formData.newHobby.trim();
    if (hobby && !profileData.hobbies.includes(hobby)) {
      setProfileData(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobby]
      }));
      setFormData(prev => ({ ...prev, newHobby: '' }));
      console.log('➕ Added hobby:', hobby, '| Current hobbies:', [...profileData.hobbies, hobby]);

      // Save journal entry for hobby addition
      try {
        await saveProfileChangeJournal('added', 'hobby', hobby, CHARACTER_ID);
      } catch (journalError) {
        console.warn('⚠️ Failed to save hobby addition journal:', journalError);
      }
    } else if (hobby && profileData.hobbies.includes(hobby)) {
      console.log('⚠️ Hobby already exists:', hobby);
    }
  };

  const handleRemoveHobby = async (hobbyToRemove) => {
    setProfileData(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(hobby => hobby !== hobbyToRemove)
    }));
    console.log('➖ Removed hobby:', hobbyToRemove);

    // Save journal entry for hobby removal
    try {
      await saveProfileChangeJournal('removed', 'hobby', hobbyToRemove, CHARACTER_ID);
    } catch (journalError) {
      console.warn('⚠️ Failed to save hobby removal journal:', journalError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Show confirmation dialog first
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: 'Confirm Submission',
      message: 'Are you sure you want to submit your data?',
      confirmText: 'Submit',
      cancelText: 'Cancel',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        // Start actual submission after user confirms
        performSubmit();
      },
      onCancel: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const performSubmit = async () => {
    setIsSubmitting(true);

    // Show processing dialog (no buttons, cannot close)
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: 'Processing...',
      message: 'Submitting your data. Please wait...',
      confirmText: null, // No button while processing
      cancelText: null,
      onConfirm: null,
      onCancel: null,
      canClose: false // Cannot close while processing
    });

    try {
      const results = [];

      // Submit Profile Update (if has data)
      const hasProfileData = formData.introduce.trim() || formData.caption.trim() || profileData.skills.length > 0 || profileData.hobbies.length > 0;

      if (hasProfileData) {
        try {
          // Debug: Log profile data before update
          console.log('🔍 Profile update data:', {
            new: {
              introduce: formData.introduce,
              caption: formData.caption,
              skills: profileData.skills,
              hobbies: profileData.hobbies
            },
            original: originalProfileData
          });

          // Use NocoDB to update profile
          const profileResult = await updateProfile({
            introduce: formData.introduce,
            caption: formData.caption,
            skills: profileData.skills,
            hobbies: profileData.hobbies
          }, originalProfileData);

          if (profileResult.success) {
            if (profileResult.message !== 'No changes to save') {
              results.push({ type: 'success', item: 'Profile' });
              // Update original profile data after successful save
              setOriginalProfileData({
                introduce: formData.introduce,
                caption: formData.caption,
                skills: [...profileData.skills],
                hobbies: [...profileData.hobbies]
              });
            }
          } else {
            console.warn('⚠️ Profile not saved:', profileResult.message);
            results.push({ type: 'failed', item: 'Profile' });
          }
        } catch (error) {
          console.error('❌ Error saving profile:', error);
          results.push({ type: 'failed', item: 'Profile' });
        }
      }

      // Submit Status Update (only if has changes from original)
      const hasStatusChanges = 
        formData.doing.trim() !== originalStatusData.doing ||
        formData.location.trim() !== originalStatusData.location ||
        formData.mood.trim() !== originalStatusData.mood ||
        formData.caption.trim() !== originalStatusData.caption;

      if (hasStatusChanges) {
        try {
          const statusResult = await saveStatus({
            doing: formData.doing,
            location: formData.location,
            caption: formData.caption,
            mood: formData.mood
          }, CHARACTER_ID);

          if (statusResult.success) {
            results.push({ type: 'success', item: 'Status' });

            // Invalidate cache and notify Home to refresh immediately
            try { clearCache(); } catch { }
            try { window.dispatchEvent(new Event('meo:refresh')); } catch { }

            // Create journal entries for changed fields
            const newDoing = formData.doing.trim();
            const newLocation = formData.location.trim();
            const newMood = formData.mood.trim();
            const newCaption = formData.caption.trim();

            const oldDoing = originalStatusData.doing;
            const oldLocation = originalStatusData.location;
            const oldMood = originalStatusData.mood;
            const oldCaption = originalStatusData.caption;

            // Check and save journal entry for each changed field
            if (newDoing !== oldDoing) {
              try {
                await saveStatusChangeJournal('doing', oldDoing, newDoing, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save activity change journal:', journalError);
              }
            }

            if (newLocation !== oldLocation) {
              try {
                await saveStatusChangeJournal('location', oldLocation, newLocation, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save location change journal:', journalError);
              }
            }

            if (newMood !== oldMood) {
              try {
                await saveStatusChangeJournal('mood', oldMood, newMood, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save mood change journal:', journalError);
              }
            }

            if (newCaption !== oldCaption) {
              try {
                await saveStatusChangeJournal('caption', oldCaption, newCaption, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save caption change journal:', journalError);
              }
            }

            // Update original status data after successful save
            setOriginalStatusData({
              doing: newDoing,
              location: newLocation,
              mood: newMood,
              caption: newCaption
            });
          } else if (statusResult.message === 'No data to save') {
            // Don't add to results if no change
          } else {
            console.warn('⚠️ Status not saved:', statusResult.message);
            results.push({ type: 'failed', item: 'Status' });
          }
        } catch (error) {
          console.error('❌ Error saving status:', error);
          results.push({ type: 'failed', item: 'Status' });
        }
      }

      // Submit Journal Entry (if has content)
      if (formData.journalEntry.trim()) {
        try {
          const journalResult = await saveJournal({
            caption: formData.journalEntry
          }, CHARACTER_ID);

          if (journalResult.success) {
            results.push({ type: 'success', item: 'Journal' });
            try { clearCache(); } catch { }
            try { window.dispatchEvent(new Event('meo:refresh')); } catch { }
          } else {
            results.push({ type: 'failed', item: 'Journal' });
          }
        } catch (error) {
          console.error('❌ Error saving journal:', error);
          results.push({ type: 'failed', item: 'Journal' });
        }
      }

      // Submit Quest Confirmations (if has submissions)
      let didAutoApprove = false;
      if (selectedQuestSubmissions.length > 0) {

        for (let i = 0; i < selectedQuestSubmissions.length; i++) {
          const submission = selectedQuestSubmissions[i];
          setUploadingQuestIndex(i);

          let imgUrl = '';
          let uploadWarning = '';

          // 1. Check if confirmation already exists and delete old image
          const existingConfirmation = await getQuestConfirmation(submission.questTitle, CHARACTER_ID);
          if (existingConfirmation && existingConfirmation.imgUrl) {
            try {
              await deleteImageByUrl(existingConfirmation.imgUrl);
            } catch (deleteError) {
              console.warn('⚠️ Could not delete old image:', deleteError.message);
              // Continue even if deletion fails
            }
          }

          // 2. Upload new image to Storage if exists (non-blocking)
          if (submission.image) {
            try {
              const uploadResult = await uploadQuestConfirmImage(
                submission.image,
                submission.questTitle
              );
              imgUrl = uploadResult.url;
            } catch (uploadError) {
              console.warn('⚠️ Image upload failed, saving without image:', uploadError.message);
              uploadWarning = ' (image upload failed)';
              // Continue to save data without image
            }
          }

          // 3. Save confirmation to quests-confirm collection (will override if exists)
          try {
            const questConfirmResult = await saveQuestConfirmation({
              questId: submission.questId,
              questName: submission.questTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            });

            // Optimistically update UI - add confirmation to state immediately
            if (questConfirmResult?.id) {
              setQuestConfirmations(prev => {
                const rest = prev.filter(c => c.questsId !== submission.questId);
                return [...rest, { 
                  id: questConfirmResult.id, 
                  name: submission.questTitle, 
                  desc: submission.description || '', 
                  imgUrl, 
                  questsId: submission.questId,
                  createdAt: new Date() 
                }];
              });
              console.log('✅ Quest confirmation added to UI state');
            }

            // Persist across blocks to evaluate after admin notify
            let xpResult = null;
            if (autoApproveTasks) {
              try {
                await updateQuest(submission.questId, { completedAt: new Date() }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve quest update failed:', e.message); }
              try {
                xpResult = await updateProfileXP(submission.questXp || 0, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve XP update failed:', e.message); }
              try {
                await saveQuestCompletionJournal({ name: submission.questTitle, desc: submission.questDesc || '', xp: submission.questXp || 0 }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve journal save failed:', e.message); }
              // Save Level Up journal AFTER quest journal to preserve order
              try {
                if (xpResult?.leveledUp) {
                  const caption = `[Level Up] Level ${xpResult.oldLevel} → ${xpResult.newLevel}`;
                  await saveJournal({ caption }, CHARACTER_ID);
                }
              } catch (e) { console.warn('⚠️ Auto-approve level up journal save failed:', e.message); }
              try { clearCache(); } catch { }

              // Optimistically update UI for auto-approve
              setAllQuests(prev => prev.map(q => q.id === submission.questId ? { ...q, completedAt: new Date() } : q));
              setAvailableQuests(prev => prev.filter(q => q.id !== submission.questId));
              didAutoApprove = true;
            }

            // Send Discord notification for quest submission
            try {
              const questData = {
                name: submission.questTitle,
                xp: submission.questXp || 0,
                desc: submission.questDesc || ''
              };

              const userData = {
                name: formData.characterName || 'Unknown User',
                level: 1 // You might want to get actual level from character data
              };

              const confirmationData = {
                desc: submission.description || '',
                imgUrl: imgUrl
              };

              await sendQuestSubmissionNotification(questData, userData, confirmationData);
            } catch (discordError) {
              console.warn('⚠️ Discord notification failed:', discordError);
              // Don't fail the entire submission if Discord fails
            }

            // Then notify admin (only when auto-approve is ON) to ensure ordering
            if (autoApproveTasks) {
              try {
                await sendAdminQuestCompletedNotification(
                  { name: submission.questTitle, desc: submission.questDesc || '', xp: submission.questXp || 0 },
                  { desc: submission.description || '', imgUrl }
                );
              } catch (e) { console.warn('⚠️ Discord admin quest notification failed:', e); }

              // Ensure level-up notification comes AFTER quest completion message
              try {
                if (xpResult?.leveledUp) {
                  await sendLevelUpNotification({ name: formData.characterName || 'Unknown User' }, {
                    oldLevel: xpResult.oldLevel,
                    newLevel: xpResult.newLevel,
                    newXP: xpResult.newXP,
                    maxXP: xpResult.maxXP
                  });
                }
              } catch (e) { console.warn('⚠️ Discord level-up notification failed:', e); }
            }

            // Remove quest from selected submissions after successful submit
            setSelectedQuestSubmissions(prev => prev.filter((_, idx) => idx !== i));
            setExpandedQuestSubmissions(prev => prev.filter((_, idx) => idx !== i));

            results.push({
              type: 'success',
              item: `Quest: ${submission.questTitle}${uploadWarning}`
            });

          } catch (error) {
            console.error('❌ Error saving quest confirmation:', submission.questTitle, error);
            results.push({ type: 'failed', item: `Quest: ${submission.questTitle}` });
          }
        }

        setUploadingQuestIndex(-1);
      }

      // Submit Achievement Confirmations (if has submissions)
      if (selectedAchievementSubmissions.length > 0) {

        for (let i = 0; i < selectedAchievementSubmissions.length; i++) {
          const submission = selectedAchievementSubmissions[i];
          setUploadingQuestIndex(i); // Reuse same state for progress indicator

          let imgUrl = '';
          let uploadWarning = '';

          // 1. Check if confirmation already exists and delete old image
          const existingConfirmation = await getAchievementConfirmation(submission.achievementTitle, CHARACTER_ID);
          if (existingConfirmation && existingConfirmation.imgUrl) {
            try {
              await deleteImageByUrl(existingConfirmation.imgUrl);
            } catch (deleteError) {
              console.warn('⚠️ Could not delete old image:', deleteError.message);
              // Continue even if deletion fails
            }
          }

          // 2. Upload new image to Storage if exists (non-blocking)
          if (submission.image) {
            try {
              const uploadResult = await uploadAchievementConfirmImage(
                submission.image,
                submission.achievementTitle
              );
              imgUrl = uploadResult.url;
            } catch (uploadError) {
              console.warn('⚠️ Image upload failed, saving without image:', uploadError.message);
              uploadWarning = ' (image upload failed)';
              // Continue to save data without image
            }
          }

          // 3. Save confirmation to achievements-confirm collection (will override if exists)
          try {
            const achConfirmResult = await saveAchievementConfirmation({
              name: submission.achievementTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            }, CHARACTER_ID);

            // Optimistically update UI - add confirmation to state immediately
            if (achConfirmResult?.id) {
              setAchievementConfirmations(prev => {
                const rest = prev.filter(c => c.achievementsId !== submission.achievementId);
                return [...rest, { 
                  id: achConfirmResult.id, 
                  achievementName: submission.achievementTitle, 
                  desc: submission.description || '', 
                  imageUrl: imgUrl,
                  achievementsId: submission.achievementId,
                  createdAt: new Date() 
                }];
              });
              console.log('✅ Achievement confirmation added to UI state');
            }

            // Persist across blocks to evaluate after admin notify
            let xpResult = null;
            if (autoApproveTasks) {
              try {
                await updateAchievement(submission.achievementId, { completedAt: new Date() }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve achievement update failed:', e.message); }
              try {
                xpResult = await updateProfileXP(submission.achievementXp || 0, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve XP update failed:', e.message); }
              try {
                await saveAchievementCompletionJournal({
                  name: submission.achievementTitle,
                  nameTranslations: submission.achievementNameTranslations,
                  desc: submission.achievementDesc || '',
                  descTranslations: submission.achievementDescTranslations,
                  xp: submission.achievementXp || 0,
                  specialReward: submission.achievementSpecialReward || '',
                  specialRewardTranslations: submission.achievementSpecialRewardTranslations
                }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve journal save failed:', e.message); }
              // Save Level Up journal AFTER achievement journal to preserve order
              try {
                if (xpResult?.leveledUp) {
                  const caption = `[Level Up] Level ${xpResult.oldLevel} → ${xpResult.newLevel}`;
                  await saveJournal({ caption }, CHARACTER_ID);
                }
              } catch (e) { console.warn('⚠️ Auto-approve level up journal save failed:', e.message); }
              try { clearCache(); } catch { }

              // Optimistically update UI for auto-approve
              setAllAchievements(prev => prev.map(a => a.id === submission.achievementId ? { ...a, completedAt: new Date() } : a));
              setAvailableAchievements(prev => prev.filter(a => a.id !== submission.achievementId));
              didAutoApprove = true;
            }

            // Send Discord notification for achievement submission
            try {
              const achievementData = {
                name: submission.achievementTitle,
                nameTranslations: submission.achievementNameTranslations,
                xp: submission.achievementXp || 0,
                desc: submission.achievementDesc || '',
                descTranslations: submission.achievementDescTranslations,
                specialReward: submission.achievementSpecialReward || '',
                specialRewardTranslations: submission.achievementSpecialRewardTranslations,
                icon: submission.achievementIcon || '🏆'
              };

              const userData = {
                name: formData.characterName || 'Unknown User',
                level: 1 // You might want to get actual level from character data
              };

              const confirmationData = {
                desc: submission.description || '',
                imgUrl: imgUrl
              };

              await sendAchievementNotification(achievementData, userData, confirmationData);
            } catch (discordError) {
              console.warn('⚠️ Discord notification failed:', discordError);
              // Don't fail the entire submission if Discord fails
            }

            // Then notify admin (only when auto-approve is ON) to ensure ordering
            if (autoApproveTasks) {
              try {
                await sendAdminAchievementCompletedNotification(
                  {
                    name: submission.achievementTitle,
                    nameTranslations: submission.achievementNameTranslations,
                    desc: submission.achievementDesc || '',
                    descTranslations: submission.achievementDescTranslations,
                    xp: submission.achievementXp || 0,
                    specialReward: submission.achievementSpecialReward || '',
                    specialRewardTranslations: submission.achievementSpecialRewardTranslations
                  },
                  { desc: submission.description || '', imgUrl }
                );
              } catch (e) { console.warn('⚠️ Discord admin achievement notification failed:', e); }

              // Ensure level-up notification comes AFTER achievement completion message
              try {
                if (xpResult?.leveledUp) {
                  await sendLevelUpNotification({ name: formData.characterName || 'Unknown User' }, {
                    oldLevel: xpResult.oldLevel,
                    newLevel: xpResult.newLevel,
                    newXP: xpResult.newXP,
                    maxXP: xpResult.maxXP
                  });
                }
              } catch (e) { console.warn('⚠️ Discord level-up notification failed:', e); }
            }

            // Remove achievement from selected submissions after successful submit
            setSelectedAchievementSubmissions(prev => prev.filter((_, idx) => idx !== i));
            setExpandedAchievementSubmissions(prev => prev.filter((_, idx) => idx !== i));

            results.push({
              type: 'success',
              item: `Achievement: ${submission.achievementTitle}${uploadWarning}`
            });

          } catch (error) {
            console.error('❌ Error saving achievement confirmation:', submission.achievementTitle, error);
            results.push({ type: 'failed', item: `Achievement: ${submission.achievementTitle}` });
          }
        }

        setUploadingQuestIndex(-1);
      }

      // Fire global refresh so Home (and others) can refetch immediately
      if (autoApproveTasks && didAutoApprove) {
        try { window.dispatchEvent(new Event('meo:refresh')); } catch { }
      }

      // Analyze results and show appropriate message
      if (results.length > 0) {
        const successItems = results.filter(r => r.type === 'success');
        const failedItems = results.filter(r => r.type === 'failed');

        let modalType, modalTitle, modalMessage;

        if (failedItems.length === 0) {
          // All success
          modalType = 'success';
          modalTitle = 'Success';
          modalMessage = successItems.map(r => `${r.item} saved successfully!`).join('\n');
        } else if (successItems.length === 0) {
          // All failed
          modalType = 'error';
          modalTitle = 'Failed';
          modalMessage = `Failed to save: ${failedItems.map(r => r.item).join(', ')}`;
        } else {
          // Partial success
          modalType = 'warning';
          modalTitle = 'Partially Completed';
          modalMessage = `✓ Saved:\n${successItems.map(r => `${r.item} saved successfully!`).join('\n')}\n\n✕ Failed: ${failedItems.map(r => r.item).join(', ')}`;
        }

        if (successItems.length > 0) {
          resetUserPageState();
        }

        setConfirmModal({
          isOpen: true,
          type: modalType,
          title: modalTitle,
          message: modalMessage,
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      } else {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'No Data',
          message: 'No data to save. Please fill in at least one field.',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
      }

    } catch (error) {
      console.error('❌ Error saving:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save: ${error.message}`,
        confirmText: 'OK',
        cancelText: null, // No cancel button for error
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      noteDate: new Date().toISOString().split('T')[0],
      doing: '',
      location: '',
      mood: '',
      journalEntry: '',
      introduce: profileData.introduce,
      newSkill: '',
      newHobby: ''
    });
    setDoingSuggestions([]);
    setDoingOpen(false);
    setLocationSuggestions([]);
    setLocationOpen(false);
    setMoodSuggestions([]);
    setMoodOpen(false);
    setSelectedQuestSubmissions([]);
    setSelectedAchievementSubmissions([]);
    setExpandedQuestSubmissions([]);
    setExpandedAchievementSubmissions([]);
  };

  // Quest submission handlers
  const handleAddQuestSubmission = (quest) => {
    const newIndex = selectedQuestSubmissions.length;
    setSelectedQuestSubmissions(prev => [...prev, {
      questId: quest.id,
      questTitle: quest.name,
      questDesc: quest.desc || '',
      questXp: quest.xp,
      description: '',
      image: null,
      imagePreview: null
    }]);
    // Add new item as collapsed by default
    setExpandedQuestSubmissions(prev => [...prev, false]);
    setShowQuestDropdown(false);
  };

  const handleRemoveQuestSubmission = (index) => {
    setSelectedQuestSubmissions(prev => prev.filter((_, i) => i !== index));
    setExpandedQuestSubmissions(prev => prev.filter((_, i) => i !== index));
  };

  const toggleQuestSubmissionExpand = (index) => {
    setExpandedQuestSubmissions(prev => prev.map((expanded, i) =>
      i === index ? !expanded : expanded
    ));
  };

  const handleQuestDescriptionChange = (index, value) => {
    setSelectedQuestSubmissions(prev => prev.map((submission, i) =>
      i === index ? { ...submission, description: value } : submission
    ));
  };

  const handleQuestImageChange = async (index, file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file (jpg, png, gif, etc.)',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: 'Image size must be less than 5MB. Please choose a smaller image.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedQuestSubmissions(prev => prev.map((submission, i) =>
        i === index ? {
          ...submission,
          image: file,
          imagePreview: reader.result,
          isUploading: false
        } : submission
      ));
    };
    reader.readAsDataURL(file);

    console.log('📷 Image selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
  };

  const handleRemoveQuestImage = (index) => {
    setSelectedQuestSubmissions(prev => prev.map((submission, i) =>
      i === index ? {
        ...submission,
        image: null,
        imagePreview: null
      } : submission
    ));
  };

  const getAvailableQuestsForDropdown = () => {
    const selectedQuestIds = selectedQuestSubmissions.map(s => s.questId);
    // Filter out quests that are already selected OR have pending confirmation OR are overdue
    return availableQuests.filter(q => {
      if (selectedQuestIds.includes(q.id)) return false;
      if (hasQuestConfirmation(q.id)) return false;
      // Filter out overdue quests (daily quests expire after creation day)
      if (isSubmissionOverdue(q, 'quest')) return false;
      return true;
    });
  };

  // Check if quest has ANY confirmation (not just today)
  const hasQuestConfirmation = (questId) => {
    // NocoDB: Match by questsId field in confirmation record
    return questConfirmations.some(c => c.questsId === questId);
  };

  // Get all quest submissions (quests that have confirmation) - include completed
  const getAllQuestSubmissions = () => {
    const questsWithConfirmation = allQuests.filter(q => hasQuestConfirmation(q.id)).map(quest => {
      const confirmation = getQuestConfirmationData(quest.id);
      return {
        ...quest,
        confirmation
      };
    });

    return questsWithConfirmation;
  };

  // Get quest confirmation data (get the most recent one if multiple exist)
  const getQuestConfirmationData = (questId) => {
    // NocoDB: Find confirmation by questsId
    return questConfirmations.find(c => c.questsId === questId) || null;
  };

  // Achievement submission handlers
  const handleAddAchievementSubmission = (achievement) => {
    const displayName = getLocalizedName(achievement);
    const displayDesc = getLocalizedDesc(achievement);
    const displayReward = getLocalizedReward(achievement);

    console.log('➕ Adding achievement submission:', displayName);
    setSelectedAchievementSubmissions(prev => [...prev, {
      achievementId: achievement.id,
      achievementTitle: displayName,
      achievementNameTranslations: achievement.nameTranslations || null,
      achievementDesc: displayDesc,
      achievementDescTranslations: achievement.descTranslations || null,
      achievementIcon: achievement.icon || '',
      achievementXp: achievement.xp,
      achievementSpecialReward: displayReward,
      achievementSpecialRewardTranslations: achievement.specialRewardTranslations || null,
      achievementDueDate: achievement.dueDate || null,
      description: '',
      image: null,
      imagePreview: null
    }]);
    // Add new item as collapsed by default
    setExpandedAchievementSubmissions(prev => [...prev, false]);
    setShowAchievementDropdown(false);
  };

  const handleRemoveAchievementSubmission = (index) => {
    console.log('➖ Removing achievement submission at index:', index);
    setSelectedAchievementSubmissions(prev => prev.filter((_, i) => i !== index));
    setExpandedAchievementSubmissions(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAchievementSubmissionExpand = (index) => {
    setExpandedAchievementSubmissions(prev => prev.map((expanded, i) =>
      i === index ? !expanded : expanded
    ));
  };

  const handleAchievementDescriptionChange = (index, value) => {
    setSelectedAchievementSubmissions(prev => prev.map((submission, i) =>
      i === index ? { ...submission, description: value } : submission
    ));
  };

  const handleAchievementImageChange = async (index, file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file (jpg, png, gif, etc.)',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: 'Image size must be less than 5MB. Please choose a smaller image.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAchievementSubmissions(prev => prev.map((submission, i) =>
        i === index ? {
          ...submission,
          image: file,
          imagePreview: reader.result,
          isUploading: false
        } : submission
      ));
    };
    reader.readAsDataURL(file);

    console.log('📷 Image selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
  };

  const handleRemoveAchievementImage = (index) => {
    setSelectedAchievementSubmissions(prev => prev.map((submission, i) =>
      i === index ? {
        ...submission,
        image: null,
        imagePreview: null
      } : submission
    ));
  };

  const getAvailableAchievementsForDropdown = () => {
    const selectedAchievementIds = selectedAchievementSubmissions.map(s => s.achievementId);
    // Filter out achievements that are already selected OR have pending confirmation
    return availableAchievements.filter(a => {
      if (selectedAchievementIds.includes(a.id)) return false;
      return !hasAchievementConfirmation(a.name);
    });
  };

  // Check if achievement has ANY confirmation (not just today)
  const hasAchievementConfirmation = (achievementId) => {
    // NocoDB: Match by achievementsId field in confirmation record
    return achievementConfirmations.some(c => c.achievementsId === achievementId);
  };

  // Get all achievement submissions (achievements that have confirmation) - include completed
  const getAllAchievementSubmissions = () => {
    const achievementsWithConfirmation = allAchievements.filter(a => hasAchievementConfirmation(a.id)).map(achievement => {
      const confirmation = getAchievementConfirmationData(achievement.id);
      return {
        ...achievement,
        confirmation
      };
    });

    return achievementsWithConfirmation;
  };

  // Get achievement confirmation data (get the most recent one if multiple exist)
  const getAchievementConfirmationData = (achievementId) => {
    // NocoDB: Find confirmation by achievementsId
    return achievementConfirmations.find(c => c.achievementsId === achievementId) || null;
  };

  // Helper function to check if a submission is overdue
  const isSubmissionOverdue = (item, itemType = 'unknown') => {
    // Get today's date at midnight (00:00:00) for accurate date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (itemType === 'quest') {
      // For quests: Daily quest chỉ có hạn trong ngày được tạo
      // Nếu createdAt < today (khác ngày) thì overdue
      if (!item.createdAt) {
        return false;
      }

      const createdDate = new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
      createdDate.setHours(0, 0, 0, 0); // Reset to midnight for date-only comparison

      const isOverdue = createdDate < today; // If created before today, it's overdue

      return isOverdue;
    } else {
      // For achievements: Only check dueDate if it exists
      if (!item.dueDate) {
        return false;
      }

      // Parse dueDate string (format: YYYY-MM-DD or similar)
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Reset to midnight for date-only comparison

      const isOverdue = today > dueDate; // If today is after dueDate, it's overdue

      return isOverdue;
    }
  };

  // Get completed quest submissions - PRIORITY 1: có completedAt != null VÀ có confirmation
  const getCompletedQuestConfirmations = () => {
    const completed = allQuests.filter(quest => {
      const hasCompleted = quest.completedAt !== null && quest.completedAt !== undefined;
      const hasConfirmation = hasQuestConfirmation(quest.name);
      return hasCompleted && hasConfirmation;
    }).map(quest => {
      const confirmation = getQuestConfirmationData(quest.name);
      return {
        ...quest,
        confirmation
      };
    });

    console.log('📋 [Review Section] Completed Quests:', completed.length, completed.map(q => ({ id: q.id, name: q.name })));
    return completed;
  };

  // Get failed (overdue) quest submissions - PRIORITY 2: CHƯA completed VÀ overdue (có hoặc không có confirmation)
  const getFailedQuestConfirmations = () => {
    const completedIds = getCompletedQuestConfirmations().map(q => q.id);

    const failed = allQuests.filter(quest => {
      // Loại bỏ quest đã completed
      if (completedIds.includes(quest.id)) return false;

      // Failed nếu: CHƯA completed VÀ đã quá hạn createdAt
      const isNotCompleted = !quest.completedAt;
      const isOverdue = isSubmissionOverdue(quest, 'quest');
      return isNotCompleted && isOverdue;
    }).map(quest => {
      const confirmation = hasQuestConfirmation(quest.name) ? getQuestConfirmationData(quest.name) : null;
      return {
        ...quest,
        confirmation
      };
    });

    console.log('📋 [Review Section] Failed Quests:', failed.length, failed.map(q => ({ id: q.id, name: q.name, hasConfirmation: !!q.confirmation })));
    return failed;
  };

  // Get pending quest submissions - PRIORITY 3: có confirmation, CHƯA completed, CHƯA overdue
  const getActivePendingQuestConfirmations = () => {
    const completedIds = getCompletedQuestConfirmations().map(q => q.id);
    const failedIds = getFailedQuestConfirmations().map(q => q.id);

    const allSubmissions = getAllQuestSubmissions();
    const activePending = allSubmissions.filter(quest => {
      // Loại bỏ quest đã completed hoặc failed
      if (completedIds.includes(quest.id) || failedIds.includes(quest.id)) return false;

      // Pending nếu: chưa completed VÀ chưa quá hạn createdAt
      const isNotCompleted = !quest.completedAt;
      const isNotOverdue = !isSubmissionOverdue(quest, 'quest');
      return isNotCompleted && isNotOverdue;
    });

    console.log('📋 [Review Section] Pending Quests:', activePending.length, activePending.map(q => ({ id: q.id, name: q.name })));
    return activePending;
  };

  // Get completed achievement submissions - PRIORITY 1: có completedAt != null VÀ có confirmation
  const getCompletedAchievementConfirmations = () => {
    const completed = allAchievements.filter(achievement => {
      const hasCompleted = achievement.completedAt !== null && achievement.completedAt !== undefined;
      const hasConfirmation = hasAchievementConfirmation(achievement.name);
      return hasCompleted && hasConfirmation;
    }).map(achievement => {
      const confirmation = getAchievementConfirmationData(achievement.name);
      return {
        ...achievement,
        confirmation
      };
    });

    console.log('📋 [Review Section] Completed Achievements:', completed.length, completed.map(a => ({ id: a.id, name: a.name })));
    return completed;
  };

  // Get failed (overdue) achievement submissions - PRIORITY 2: CHƯA completed VÀ có dueDate VÀ overdue
  const getFailedAchievementConfirmations = () => {
    const completedIds = getCompletedAchievementConfirmations().map(a => a.id);

    const failed = allAchievements.filter(achievement => {
      // Loại bỏ achievement đã completed
      if (completedIds.includes(achievement.id)) return false;

      // Failed chỉ khi: CHƯA completed VÀ có dueDate VÀ đã quá hạn
      const isNotCompleted = !achievement.completedAt;
      const hasDeadline = achievement.dueDate;
      const isOverdue = hasDeadline && isSubmissionOverdue(achievement, 'achievement');
      return isNotCompleted && isOverdue;
    }).map(achievement => {
      const confirmation = hasAchievementConfirmation(achievement.name) ? getAchievementConfirmationData(achievement.name) : null;
      return {
        ...achievement,
        confirmation
      };
    });

    console.log('📋 [Review Section] Failed Achievements:', failed.length, failed.map(a => ({ id: a.id, name: a.name, hasConfirmation: !!a.confirmation, dueDate: a.dueDate })));
    return failed;
  };

  // Get pending achievement submissions - PRIORITY 3: có confirmation, CHƯA completed, CHƯA overdue
  const getActivePendingAchievementConfirmations = () => {
    const completedIds = getCompletedAchievementConfirmations().map(a => a.id);
    const failedIds = getFailedAchievementConfirmations().map(a => a.id);

    const allSubmissions = getAllAchievementSubmissions();
    const activePending = allSubmissions.filter(achievement => {
      // Loại bỏ achievement đã completed hoặc failed
      if (completedIds.includes(achievement.id) || failedIds.includes(achievement.id)) return false;

      // Pending nếu: chưa completed VÀ (không có dueDate HOẶC chưa quá hạn dueDate)
      const isNotCompleted = !achievement.completedAt;
      const isNotOverdue = !achievement.dueDate || !isSubmissionOverdue(achievement, 'achievement');
      return isNotCompleted && isNotOverdue;
    });

    console.log('📋 [Review Section] Pending Achievements:', activePending.length, activePending.map(a => ({ id: a.id, name: a.name, dueDate: a.dueDate })));
    return activePending;
  };

  if (showPasswordModal) {
    return (
      <PasswordModal
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formattedDate = new Date(formData.noteDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="notes-container">
      <header className="notes-header">
        <button onClick={onBack} className="back-link">◄ Back</button>
        <h1>✎ Daily Update</h1>
        <button
          onClick={handleRefresh}
          className="refresh-button"
          disabled={isRefreshing || isSubmitting}
          title="Refresh data from database"
        >
          {isRefreshing ? '⟳' : '↻'}
        </button>
        <div className="subtitle">
          {formattedDate}
        </div>
      </header>

      <main className="update-form">
        <form id="dailyUpdateForm" onSubmit={handleSubmit}>

          {/* Profile Update */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                setProfileExpanded(!profileExpanded);
              }}
            >
              {profileExpanded ? '▼' : '▸'} Profile Update
            </h2>

            {profileExpanded && (
              <div className="section-content">
                {!profileLoaded && (
                  <div className="userpage-loading-message">
                    Loading profile data...
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="introduce">Introduction</label>
                  <textarea
                    id="introduce"
                    name="introduce"
                    rows="6"
                    value={formData.introduce}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    disabled={!profileLoaded}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="caption">Caption</label>
                  <input
                    type="text"
                    id="caption"
                    name="caption"
                    value={formData.caption}
                    onChange={handleChange}
                    placeholder="e.g., Forever Curious"
                    autoComplete="off"
                    disabled={!profileLoaded}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newSkill">Skills {profileData.skills.length > 0 && `(${profileData.skills.length})`}</label>
                  <div className="userpage-skill-input-section">
                    <input
                      type="text"
                      id="newSkill"
                      name="newSkill"
                      value={formData.newSkill}
                      onChange={handleChange}
                      placeholder="Add a skill..."
                      disabled={!profileLoaded}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="userpage-add-btn"
                      onClick={handleAddSkill}
                      disabled={!profileLoaded || !formData.newSkill.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {profileData.skills.length > 0 && (
                    <div className="userpage-tags-container">
                      {profileData.skills.map((skill, index) => (
                        <div key={index} className="userpage-tag">
                          <span>{skill}</span>
                          <button
                            type="button"
                            className="userpage-tag-remove"
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newHobby">Hobbys {profileData.hobbies.length > 0 && `(${profileData.hobbies.length})`}</label>
                  <div className="userpage-skill-input-section">
                    <input
                      type="text"
                      id="newHobby"
                      name="newHobby"
                      value={formData.newHobby}
                      onChange={handleChange}
                      placeholder="Add an Hobby..."
                      disabled={!profileLoaded}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHobby();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="userpage-add-btn"
                      onClick={handleAddHobby}
                      disabled={!profileLoaded || !formData.newHobby.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {profileData.hobbies.length > 0 && (
                    <div className="userpage-tags-container">
                      {profileData.hobbies.map((Hobby, index) => (
                        <div key={index} className="userpage-tag">
                          <span>{Hobby}</span>
                          <button
                            type="button"
                            className="userpage-tag-remove"
                            onClick={() => handleRemoveHobby(Hobby)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                console.log('Status Update section clicked');
                setStatusExpanded(!statusExpanded);
              }}
            >
              {statusExpanded ? '▼' : '▸'} Status Update
            </h2>

            {statusExpanded && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="doing">Current Activity</label>
                  <div className="suggest-wrap" ref={doingRef}>
                    <input
                      type="text"
                      id="doing"
                      name="doing"
                      value={formData.doing}
                      onChange={handleChange}
                      placeholder="e.g., Studying character design"
                      autoComplete="off"
                    />
                    {formData.doing && (
                      <button
                        type="button"
                        className="suggest-clear-btn"
                        onClick={() => setFormData(prev => ({ ...prev, doing: '' }))}
                        aria-label="Clear current activity"
                      >
                        ✕
                      </button>
                    )}
                    {doingOpen && doingSuggestions.length > 0 && (
                      <div className="suggest-dropdown" role="listbox">
                        {doingSuggestions.map((item) => (
                          <div
                            key={item}
                            role="option"
                            className="suggest-item"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, doing: item }));
                              setDoingOpen(false);
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <div className="suggest-wrap" ref={locationRef}>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Home, Coffee shop, Office"
                      autoComplete="off"
                      onFocus={openLocationDropdown}
                      onClick={openLocationDropdown}
                    />
                    {formData.location && (
                      <button
                        type="button"
                        className="suggest-clear-btn"
                        onClick={() => setFormData(prev => ({ ...prev, location: '' }))}
                        aria-label="Clear location"
                      >
                        ✕
                      </button>
                    )}
                    {locationOpen && locationSuggestions.length > 0 && (
                      <div className="suggest-dropdown" role="listbox">
                        {locationSuggestions.map((item) => (
                          <div
                            key={item}
                            role="option"
                            className="suggest-item"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, location: item }));
                              setLocationOpen(false);
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mood">Mood</label>
                  <div className="suggest-wrap" ref={moodRef}>
                    <input
                      type="text"
                      id="mood"
                      name="mood"
                      value={formData.mood}
                      onChange={handleChange}
                      placeholder="e.g., buồn ngủ, hạnh phúc"
                      autoComplete="off"
                      onFocus={openMoodDropdown}
                      onClick={openMoodDropdown}
                    />
                    {formData.mood && (
                      <button
                        type="button"
                        className="suggest-clear-btn"
                        onClick={() => setFormData(prev => ({ ...prev, mood: '' }))}
                        aria-label="Clear mood"
                      >
                        ✕
                      </button>
                    )}
                    {moodOpen && moodSuggestions.length > 0 && (
                      <div className="suggest-dropdown" role="listbox">
                        {moodSuggestions.map((item) => (
                          <div
                            key={item}
                            role="option"
                            className="suggest-item"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, mood: item }));
                              setMoodOpen(false);
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daily Journal */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                console.log('Daily Journal section clicked');
                setJournalExpanded(!journalExpanded);
              }}
            >
              {journalExpanded ? '▼' : '▸'} Daily Journal
            </h2>

            {journalExpanded && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="journalEntry">Current Journal</label>
                  <textarea
                    id="journalEntry"
                    name="journalEntry"
                    rows="12"
                    value={formData.journalEntry}
                    onChange={handleChange}
                    placeholder={`Viết về ngày hôm nay của bạn...

◆ Đã làm gì?
◆ Cảm xúc, suy nghĩ?
◆ Điều đáng nhớ?
◆ Bài học rút ra?`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Daily Quests Update */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                setQuestsExpanded(prev => {
                  const next = !prev;
                  if (next) setQuestPickerCollapsed(false);
                  return next;
                });
              }}
            >
              {questsExpanded ? '▼' : '▸'} Daily Quests Update ({getAvailableQuestsForDropdown().length + selectedQuestSubmissions.length})
            </h2>

            {questsExpanded && (
              <div className="section-content">
                {/* Always-visible quest picker */}
                <div className="quest-add-section">
                  {getAvailableQuestsForDropdown().length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="dropdown-collapse-btn"
                        onClick={() => setQuestPickerCollapsed(v => !v)}
                        aria-expanded={!questPickerCollapsed}
                        aria-controls="quest-picker"
                      >
                        {questPickerCollapsed ? '▾ Show list' : '▴ Hide list'}
                      </button>
                      {!questPickerCollapsed && (
                        <div id="quest-picker" className="quest-dropdown dropdown-static" ref={questDropdownRef}>
                          {getAvailableQuestsForDropdown().map(quest => (
                            <div
                              key={quest.id}
                              className="quest-dropdown-item"
                              onClick={() => handleAddQuestSubmission(quest)}
                            >
                              <span className="quest-dropdown-title">{quest.name}</span>
                              <span className="quest-dropdown-xp">+{quest.xp} XP</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="no-quests-message">No incomplete quests available</p>
                  )}
                </div>

                {/* Quest Submission Forms */}
                {selectedQuestSubmissions.map((submission, index) => {
                  const hasConfirm = hasQuestConfirmation(submission.questTitle);
                  const isExpanded = expandedQuestSubmissions[index] || false;
                  return (
                    <div key={index} className="quest-submission-form">
                      <div
                        className="quest-submission-header clickable"
                        onClick={() => toggleQuestSubmissionExpand(index)}
                      >
                        <div className="quest-submission-info">
                          <h3 className="quest-submission-title">
                            {isExpanded ? '▼' : '▸'} ⚔️ {submission.questTitle} <span className="quest-xp-badge">+{submission.questXp} XP</span>
                            {hasConfirm && <span className="quest-status-badge pending">📝 Review Submitted</span>}
                          </h3>
                          {submission.questDesc && (
                            <p className="quest-submission-desc">{submission.questDesc}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-remove-quest"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent header click
                            handleRemoveQuestSubmission(index);
                          }}
                          disabled={isSubmitting}
                        >
                          ✕
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="quest-submission-content">
                          <div className="form-group">
                            <label htmlFor={`quest-desc-${index}`}>Description</label>
                            <textarea
                              id={`quest-desc-${index}`}
                              rows="4"
                              value={submission.description}
                              onChange={(e) => handleQuestDescriptionChange(index, e.target.value)}
                              placeholder="Describe how you completed this quest..."
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`quest-image-${index}`}>Attach Image</label>
                            <div className="image-upload-section">
                              {!submission.imagePreview ? (
                                <div className="image-upload-placeholder">
                                  <input
                                    type="file"
                                    id={`quest-image-${index}`}
                                    accept="image/*"
                                    onChange={(e) => handleQuestImageChange(index, e.target.files[0])}
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                  />
                                  <label htmlFor={`quest-image-${index}`} className={`btn-upload-image ${isSubmitting ? 'disabled' : ''}`}>
                                    📷 Choose Image or Take Photo
                                  </label>
                                </div>
                              ) : (
                                <div className="image-preview-container">
                                  <img
                                    src={submission.imagePreview}
                                    alt="Quest completion"
                                    className="image-preview"
                                  />
                                  <button
                                    type="button"
                                    className="btn-remove-image"
                                    onClick={() => handleRemoveQuestImage(index)}
                                    disabled={isSubmitting}
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Achievements Update */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                console.log('Achievements Update section clicked');
                setAchievementsExpanded(prev => {
                  const next = !prev;
                  if (next) setAchievementPickerCollapsed(false);
                  return next;
                });
              }}
            >
              {achievementsExpanded ? '▼' : '▸'} Achievements Update ({getAvailableAchievementsForDropdown().length + selectedAchievementSubmissions.length})
            </h2>

            {achievementsExpanded && (
              <div className="section-content">
                {/* Always-visible achievement picker */}
                <div className="quest-add-section">
                  {getAvailableAchievementsForDropdown().length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="dropdown-collapse-btn"
                        onClick={() => setAchievementPickerCollapsed(v => !v)}
                        aria-expanded={!achievementPickerCollapsed}
                        aria-controls="achievement-picker"
                      >
                        {achievementPickerCollapsed ? '▾ Show list' : '▴ Hide list'}
                      </button>
                      {!achievementPickerCollapsed && (
                        <div id="achievement-picker" className="quest-dropdown dropdown-static" ref={achievementDropdownRef}>
                          {getAvailableAchievementsForDropdown().map(achievement => {
                            const displayName = getLocalizedName(achievement);
                            const specialRewardText = getLocalizedReward(achievement);

                            return (
                              <div
                                key={achievement.id}
                                className="quest-dropdown-item"
                                onClick={() => handleAddAchievementSubmission(achievement)}
                              >
                                <span className="quest-dropdown-title">
                                  {achievement.icon && (
                                    <IconRenderer iconName={achievement.icon} size={20} />
                                  )}
                                  {' '}{displayName}
                                  {achievement.dueDate && <span className="confirmation-badge">📅 {typeof achievement.dueDate === 'string' ? achievement.dueDate : new Date(achievement.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>}
                                </span>
                                <span className="quest-dropdown-xp">
                                  {achievement.xp > 0 && `+${achievement.xp} XP`}
                                  {specialRewardText && ` 🎁 ${specialRewardText}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="no-quests-message">No incomplete achievements available</p>
                  )}
                </div>

                {/* Achievement Submission Forms */}
                {selectedAchievementSubmissions.map((submission, index) => {
                  const hasConfirm = hasAchievementConfirmation(submission.achievementTitle);
                  const isExpanded = expandedAchievementSubmissions[index] || false;
                  return (
                    <div key={index} className="quest-submission-form">
                      <div
                        className="quest-submission-header clickable"
                        onClick={() => toggleAchievementSubmissionExpand(index)}
                      >
                        <div className="quest-submission-info">
                          <h3 className="quest-submission-title">
                            {isExpanded ? '▼' : '▸'}
                            {submission.achievementIcon && (
                              <IconRenderer iconName={submission.achievementIcon} size={24} />
                            )}
                            {' '}{submission.achievementTitle}
                            {submission.achievementXp > 0 && <span className="quest-xp-badge">+{submission.achievementXp} XP</span>}
                            {submission.achievementSpecialReward && <span className="quest-xp-badge">🎁 {submission.achievementSpecialReward}</span>}
                            {hasConfirm && <span className="quest-status-badge pending">📝 Review Submitted</span>}
                          </h3>
                          {submission.achievementDesc && (
                            <p className="quest-submission-desc">{submission.achievementDesc}</p>
                          )}
                          {submission.achievementDueDate && (
                            <p className="quest-submission-desc">📅 Due: {typeof submission.achievementDueDate === 'string' ? submission.achievementDueDate : new Date(submission.achievementDueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-remove-quest"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent header click
                            handleRemoveAchievementSubmission(index);
                          }}
                          disabled={isSubmitting}
                        >
                          ✕
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="quest-submission-content">
                          <div className="form-group">
                            <label htmlFor={`achievement-desc-${index}`}>Description</label>
                            <textarea
                              id={`achievement-desc-${index}`}
                              rows="4"
                              value={submission.description}
                              onChange={(e) => handleAchievementDescriptionChange(index, e.target.value)}
                              placeholder="Describe how you achieved this..."
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`achievement-image-${index}`}>Attach Image</label>
                            <div className="image-upload-section">
                              {!submission.imagePreview ? (
                                <div className="image-upload-placeholder">
                                  <input
                                    type="file"
                                    id={`achievement-image-${index}`}
                                    accept="image/*"
                                    onChange={(e) => handleAchievementImageChange(index, e.target.files[0])}
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                  />
                                  <label htmlFor={`achievement-image-${index}`} className={`btn-upload-image ${isSubmitting ? 'disabled' : ''}`}>
                                    📷 Choose Image or Take Photo
                                  </label>
                                </div>
                              ) : (
                                <div className="image-preview-container">
                                  <img
                                    src={submission.imagePreview}
                                    alt="Achievement completion"
                                    className="image-preview"
                                  />
                                  <button
                                    type="button"
                                    className="btn-remove-image"
                                    onClick={() => handleRemoveAchievementImage(index)}
                                    disabled={isSubmitting}
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review Submitted Section - always visible */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                setReviewSubmittedExpanded(!reviewSubmittedExpanded);
              }}
            >
              {reviewSubmittedExpanded ? '▼' : '▸'} Review Submitted ({getAllQuestSubmissions().length + getAllAchievementSubmissions().length})
            </h2>

            {reviewSubmittedExpanded && (
              <div className="section-content">
                {/* Pending Review Group - Always show */}
                <div className="review-group">
                  <h3
                    className="review-group-title clickable"
                    onClick={() => {
                      setPendingGroupExpanded(!pendingGroupExpanded);
                    }}
                  >
                    {pendingGroupExpanded ? '▼' : '▸'} ⏳ Pending Review ({getActivePendingQuestConfirmations().length + getActivePendingAchievementConfirmations().length})
                  </h3>

                  {pendingGroupExpanded && (
                    <div className="review-group-content">
                      {/* Active Pending Quests */}
                      {getActivePendingQuestConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests ({getActivePendingQuestConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getActivePendingQuestConfirmations().map(quest => {
                              const createdAt = quest.confirmation?.createdAt;
                              const formattedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;

                              return (
                                <div key={quest.id} className="pending-item">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">⚔️ {quest.name}</span>
                                    <span className="pending-item-badge pending">Pending</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">+{quest.xp} XP</span>
                                    {formattedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                    )}
                                    {quest.confirmation?.desc && (
                                      <p className="pending-item-desc">{quest.confirmation.desc}</p>
                                    )}
                                    {quest.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={quest.confirmation.imgUrl} alt="Quest confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests (0)</h4>
                          <div className="empty-message">No pending quest submissions.</div>
                        </div>
                      )}

                      {/* Active Pending Achievements */}
                      {getActivePendingAchievementConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements ({getActivePendingAchievementConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getActivePendingAchievementConfirmations().map(achievement => {
                              const createdAt = achievement.confirmation?.createdAt;
                              const formattedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;
                              const displayName = getLocalizedName(achievement);
                              const specialRewardText = getLocalizedReward(achievement);

                              return (
                                <div key={achievement.id} className="pending-item">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">
                                      {achievement.icon && (
                                        <IconRenderer iconName={achievement.icon} size={20} />
                                      )}
                                      {' '}{displayName}
                                    </span>
                                    <span className="pending-item-badge pending">Pending</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">
                                      {achievement.xp > 0 && `+${achievement.xp} XP`}
                                      {specialRewardText && ` 🎁 ${specialRewardText}`}
                                    </span>
                                    {formattedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                    )}
                                    {achievement.dueDate && (
                                      <p className="pending-item-desc">📅 Due: {typeof achievement.dueDate === 'string' ? achievement.dueDate : new Date(achievement.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                    )}
                                    {achievement.confirmation?.desc && (
                                      <p className="pending-item-desc">{achievement.confirmation.desc}</p>
                                    )}
                                    {achievement.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={achievement.confirmation.imgUrl} alt="Achievement confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements (0)</h4>
                          <div className="empty-message">No pending achievement submissions.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Failed Group - Always show */}
                <div className="review-group">
                  <h3
                    className="review-group-title clickable failed"
                    onClick={() => {
                      setFailedGroupExpanded(!failedGroupExpanded);
                    }}
                  >
                    {failedGroupExpanded ? '▼' : '▸'} ❌ Failed ({getFailedQuestConfirmations().length + getFailedAchievementConfirmations().length})
                  </h3>

                  {failedGroupExpanded && (
                    <div className="review-group-content">
                      {/* Failed Quests */}
                      {getFailedQuestConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests ({getFailedQuestConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getFailedQuestConfirmations().map(quest => {
                              const createdAt = quest.confirmation?.createdAt;
                              const formattedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;

                              return (
                                <div key={quest.id} className="pending-item failed">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">⚔️ {quest.name}</span>
                                    <span className="pending-item-badge failed">Failed</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">+{quest.xp} XP</span>
                                    {formattedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                    )}
                                    {quest.dueDate && (
                                      <p className="pending-item-date overdue">⚠️ Due: {typeof quest.dueDate === 'string' ? quest.dueDate : new Date(quest.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Overdue)</p>
                                    )}
                                    {quest.confirmation?.desc && (
                                      <p className="pending-item-desc">{quest.confirmation.desc}</p>
                                    )}
                                    {quest.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={quest.confirmation.imgUrl} alt="Quest confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests (0)</h4>
                          <div className="empty-message">No failed quest submissions.</div>
                        </div>
                      )}

                      {/* Failed Achievements */}
                      {getFailedAchievementConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements ({getFailedAchievementConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getFailedAchievementConfirmations().map(achievement => {
                              const createdAt = achievement.confirmation?.createdAt;
                              const formattedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;
                              const displayName = getLocalizedName(achievement);
                              const specialRewardText = getLocalizedReward(achievement);

                              return (
                                <div key={achievement.id} className="pending-item failed">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">
                                      {achievement.icon && (
                                        <IconRenderer iconName={achievement.icon} size={20} />
                                      )}
                                      {' '}{displayName}
                                    </span>
                                    <span className="pending-item-badge failed">Failed</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">
                                      {achievement.xp > 0 && `+${achievement.xp} XP`}
                                      {specialRewardText && ` 🎁 ${specialRewardText}`}
                                    </span>
                                    {formattedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                    )}
                                    {achievement.dueDate && (
                                      <p className="pending-item-date overdue">⚠️ Due: {typeof achievement.dueDate === 'string' ? achievement.dueDate : new Date(achievement.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Overdue)</p>
                                    )}
                                    {achievement.confirmation?.desc && (
                                      <p className="pending-item-desc">{achievement.confirmation.desc}</p>
                                    )}
                                    {achievement.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={achievement.confirmation.imgUrl} alt="Achievement confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements (0)</h4>
                          <div className="empty-message">No failed achievement submissions.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Completed Group - Always show */}
                <div className="review-group">
                  <h3
                    className="review-group-title clickable completed"
                    onClick={() => {
                      setCompletedGroupExpanded(!completedGroupExpanded);
                    }}
                  >
                    {completedGroupExpanded ? '▼' : '▸'} ✅ Completed ({getCompletedQuestConfirmations().length + getCompletedAchievementConfirmations().length})
                  </h3>

                  {completedGroupExpanded && (
                    <div className="review-group-content">
                      {/* Completed Quests */}
                      {getCompletedQuestConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests ({getCompletedQuestConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getCompletedQuestConfirmations().map(quest => {
                              const createdAt = quest.confirmation?.createdAt;
                              const completedAt = quest.completedAt;
                              const formattedSubmittedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;
                              const formattedCompletedDate = completedAt
                                ? new Date(completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;

                              return (
                                <div key={quest.id} className="pending-item completed">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">⚔️ {quest.name}</span>
                                    <span className="pending-item-badge completed">Completed</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">+{quest.xp} XP</span>
                                    {formattedSubmittedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedSubmittedDate}</p>
                                    )}
                                    {formattedCompletedDate && (
                                      <p className="pending-item-date completed">✅ Completed: {formattedCompletedDate}</p>
                                    )}
                                    {quest.confirmation?.desc && (
                                      <p className="pending-item-desc">{quest.confirmation.desc}</p>
                                    )}
                                    {quest.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={quest.confirmation.imgUrl} alt="Quest confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">⚔️ Quests (0)</h4>
                          <div className="empty-message">No completed quest submissions.</div>
                        </div>
                      )}

                      {/* Completed Achievements */}
                      {getCompletedAchievementConfirmations().length > 0 ? (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements ({getCompletedAchievementConfirmations().length})</h4>
                          <div className="pending-items-list">
                            {getCompletedAchievementConfirmations().map(achievement => {
                              const createdAt = achievement.confirmation?.createdAt;
                              const completedAt = achievement.completedAt;
                              const formattedSubmittedDate = createdAt
                                ? new Date(createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;
                              const formattedCompletedDate = completedAt
                                ? new Date(completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : null;
                              const displayName = getLocalizedName(achievement);
                              const specialRewardText = getLocalizedReward(achievement);

                              return (
                                <div key={achievement.id} className="pending-item completed">
                                  <div className="pending-item-header">
                                    <span className="pending-item-title">
                                      {achievement.icon && (
                                        <IconRenderer iconName={achievement.icon} size={20} />
                                      )}
                                      {' '}{displayName}
                                    </span>
                                    <span className="pending-item-badge completed">Completed</span>
                                  </div>
                                  <div className="pending-item-details">
                                    <span className="pending-item-xp">
                                      {achievement.xp > 0 && `+${achievement.xp} XP`}
                                      {specialRewardText && ` 🎁 ${specialRewardText}`}
                                    </span>
                                    {formattedSubmittedDate && (
                                      <p className="pending-item-date">📅 Submitted: {formattedSubmittedDate}</p>
                                    )}
                                    {formattedCompletedDate && (
                                      <p className="pending-item-date completed">✅ Completed: {formattedCompletedDate}</p>
                                    )}
                                    {achievement.dueDate && (
                                      <p className="pending-item-desc">📅 Due: {typeof achievement.dueDate === 'string' ? achievement.dueDate : new Date(achievement.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                    )}
                                    {achievement.confirmation?.desc && (
                                      <p className="pending-item-desc">{achievement.confirmation.desc}</p>
                                    )}
                                    {achievement.confirmation?.imgUrl && (
                                      <div className="pending-item-image">
                                        <img src={achievement.confirmation.imgUrl} alt="Achievement confirmation" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pending-category">
                          <h4 className="pending-subcategory-title">🏆 Achievements (0)</h4>
                          <div className="empty-message">No completed achievement submissions.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                uploadingQuestIndex >= 0
                  ? `Uploading ${uploadingQuestIndex + 1}/${selectedQuestSubmissions.length + selectedAchievementSubmissions.length}...`
                  : 'Submitting...'
              ) : 'Submit'}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary" disabled={isSubmitting}>
              ✕ Reset
            </button>
          </div>
        </form>
      </main>

      <footer className="notes-footer">
        <p>◆ Keep tracking your journey</p>
      </footer>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        canClose={confirmModal.canClose !== false} // Default true, only false when explicitly set
      />
    </div>
  );
};

export default UserPage;


