import { useState, useEffect, useRef } from 'react';
import './UserPage.css';

import { fetchConfig, fetchProfile, fetchStatus, updateProfile, saveStatus, saveJournal, fetchQuests, fetchQuestConfirmations, fetchAchievements, fetchAchievementConfirmations, saveQuestConfirmation, saveAchievementConfirmation, updateQuest, updateAchievement, batchUpdateQuestConfirmationStatus, clearNocoDBCache, updateProfileXP, savePhotoAlbum, fetchPhotoAlbums, uploadProfileGalleryImages, fetchProfileGallery, CHARACTER_ID } from '../../services/nocodb';
import { saveQuestCompletionJournal, saveAchievementCompletionJournal, saveStatusChangeJournal, saveProfileChangeJournal } from '../../utils/questJournalUtils';
import { clearCache, clearRefreshCooldown } from '../../utils/cacheManager';
import { uploadQuestConfirmationImage, uploadAchievementConfirmationImage } from '../../services/nocodb';
// import { deleteImageByUrl } from '../../services/storage'; // Deprecated - using NocoDB
import { sendQuestSubmissionNotification, sendAchievementNotification, sendAdminQuestCompletedNotification, sendAdminAchievementCompletedNotification, sendLevelUpNotification } from '../../services/discord';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import IconRenderer from '../../components/IconRenderer/IconRenderer';
import { LoadingDialog } from '../../components/common';

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
    newHobby: '',
    albumDescription: '',
    galleryDescription: ''
  });

  // Profile data states
  // Note: 'Hobbys' in UI maps to 'hobbies' field in NocoDB profile table
  const [profileData, setProfileData] = useState({ introduce: '', skills: [], hobbies: [] });
  const [originalProfileData, setOriginalProfileData] = useState({ introduce: '', skills: [], hobbies: [] });
  const [statusData, setStatusData] = useState(null);
  const [originalStatusData, setOriginalStatusData] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Loading state for all data

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
  
  // Photo Album states
  const [albumImages, setAlbumImages] = useState([]);
  const [photoAlbums, setPhotoAlbums] = useState([]);
  const [photoAlbumExpanded, setPhotoAlbumExpanded] = useState(false);

  // Profile Gallery states
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

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

  // Collapse/expand states - Status expanded by default to show current data
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(true); // Expanded by default
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

  const reloadDataAfterSubmit = async () => {
    try {
      // Clear cache and cooldown to allow immediate refresh
      clearCache();
      clearRefreshCooldown();
      clearNocoDBCache();
      
      // Reload quests and achievements data
      const [questsData, questConfirmsData, achievementsData, achievementConfirmsData] = await Promise.all([
        fetchQuests(),
        fetchQuestConfirmations(),
        fetchAchievements(),
        fetchAchievementConfirmations()
      ]);

      // Update state with fresh data
      const availableQuestsData = questsData.filter(q => q.completedAt === null);
      setAllQuests(questsData);
      setAvailableQuests(availableQuestsData);
      setQuestConfirmations(questConfirmsData);

      const availableAchievementsData = achievementsData.filter(a => a.completedAt === null);
      setAllAchievements(achievementsData);
      setAvailableAchievements(availableAchievementsData);
      setAchievementConfirmations(achievementConfirmsData);

      // Notify HomePage to refresh
      try { window.dispatchEvent(new Event('meo:refresh')); } catch { }
    } catch (error) {
      console.error('❌ Error reloading data after submit:', error);
    }
  };

  // Debug: Log formData changes
  useEffect(() => {
  }, [formData.doing, formData.location, formData.mood, formData.caption]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      albumImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [albumImages]);

  useEffect(() => {
    // Load all data from NocoDB in optimized sequence
    const loadData = async () => {
      setDataLoading(true);
      
      try {

        
        // Phase 1: Load critical data (config, profile, status) in parallel
        // These are cached and deduplicated automatically
        const [cfg, profile, statusData] = await Promise.all([
          fetchConfig(),
          fetchProfile(),
          fetchStatus()
        ]);

        // Load config data
        if (cfg) {
          setAutoApproveTasks(!!cfg.autoApproveTasks);
          setCorrectPassword(cfg.pwDailyUpdate || null);

        } else {
          setCorrectPassword(null);
          console.warn('⚠️ No config found');
        }

        // Load profile data
        if (profile) {
          const loadedSkills = Array.isArray(profile.skills) ? profile.skills : [];
          const loadedHobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];

          const loadedProfile = {
            id: profile.id || profile.Id || null,
            introduce: profile.introduce || '',
            caption: profile.caption || '',
            skills: [...loadedSkills],
            hobbies: [...loadedHobbies]
          };

          setProfileData(loadedProfile);
          setOriginalProfileData(JSON.parse(JSON.stringify(loadedProfile)));

        } else {
          setProfileData({ introduce: '', skills: [], hobbies: [] });
          setOriginalProfileData({ introduce: '', skills: [], hobbies: [] });
          console.warn('⚠️ No profile found');
        }

        // Load status data
        if (statusData) {
          // Debug: Log raw status data (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('📊 Raw status data from NocoDB:', statusData);
          }
          
          // Prepare existing doings
          const doingsArr = Array.isArray(statusData.doing) ? statusData.doing : [];
          const seen = new Set();
          const normalized = [];
          doingsArr.forEach((d) => {
            const s = String(d).trim();
            const key = s.toLowerCase();
            if (s && !seen.has(key)) { seen.add(key); normalized.push(s); }
          });
          setExistingDoings(normalized);
          // Debug: Log existing doings (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Existing doings:', normalized);
          }

          // Prepare existing locations
          const locArr = Array.isArray(statusData.location) ? statusData.location : [];
          const seenLoc = new Set();
          const normalizedLocs = [];
          locArr.forEach((l) => {
            const s = String(l).trim();
            const key = s.toLowerCase();
            if (s && !seenLoc.has(key)) { seenLoc.add(key); normalizedLocs.push(s); }
          });
          setExistingLocations(normalizedLocs);

          // Prepare existing moods
          const moodArr = Array.isArray(statusData.mood) ? statusData.mood : [];
          const seenMood = new Set();
          const normalizedMoods = [];
          moodArr.forEach((m) => {
            const s = String(m).trim();
            const key = s.toLowerCase();
            if (s && !seenMood.has(key)) { seenMood.add(key); normalizedMoods.push(s); }
          });
          setExistingMoods(normalizedMoods);

          // Save original status data
          const originalStatus = {
            doing: normalizeStatusValue(statusData.doing),
            location: normalizeStatusValue(statusData.location),
            mood: normalizeStatusValue(statusData.mood),
            caption: profile?.caption || ''
          };
          setOriginalStatusData(originalStatus);

          // Apply to form
          if (import.meta.env.MODE !== 'production') {
            console.log('📝 Loading status data into form:', {
              doing: originalStatus.doing,
              location: originalStatus.location,
              mood: originalStatus.mood,
              caption: originalStatus.caption
            });
          }
          
          setFormData(prev => ({
            ...prev,
            doing: originalStatus.doing,
            location: originalStatus.location,
            mood: originalStatus.mood,
            caption: originalStatus.caption,
            introduce: profile?.introduce || ''
          }));


        } else {
          setOriginalStatusData({ doing: '', location: '', mood: '', caption: '' });
          console.warn('⚠️ No status found');
        }

        setProfileLoaded(true);

        // Delay before Phase 2 to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Phase 2: Load quests and achievements data in staggered batches

        
        // Batch 2a: Load quests data
        const [questsData, questConfirmsData] = await Promise.all([
          fetchQuests(),
          fetchQuestConfirmations()
        ]);

        // Small delay before batch 2b
        await new Promise(resolve => setTimeout(resolve, 300));

        // Batch 2b: Load achievements data
        const [achievementsData, achievementConfirmsData] = await Promise.all([
          fetchAchievements(),
          fetchAchievementConfirmations()
        ]);

        // Process quests
        const availableQuestsData = questsData.filter(q => q.completedAt === null);
        setAllQuests(questsData);
        setAvailableQuests(availableQuestsData);
        setQuestConfirmations(questConfirmsData);

        // Process achievements
        const availableAchievementsData = achievementsData.filter(a => a.completedAt === null);
        setAllAchievements(achievementsData);
        setAvailableAchievements(availableAchievementsData);
        setAchievementConfirmations(achievementConfirmsData);



        // Phase 3: Check and update overdue quest confirmations
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const overdueUpdates = [];

          for (const confirmation of questConfirmsData) {
            if (confirmation.status === 'failed' || confirmation.status === 'completed') {
              continue;
            }

            const linkedQuest = questsData.find(q => q.id === confirmation.questsId);
            if (!linkedQuest || linkedQuest.completedAt) continue;

            if (linkedQuest.createdAt) {
              const createdDate = new Date(linkedQuest.createdAt);
              createdDate.setHours(0, 0, 0, 0);

              if (createdDate < today) {
                overdueUpdates.push({
                  id: confirmation.id,
                  status: 'failed'
                });
              }
            }
          }

          if (overdueUpdates.length > 0) {

            await batchUpdateQuestConfirmationStatus(overdueUpdates);
            
            setQuestConfirmations(prev => 
              prev.map(c => {
                const update = overdueUpdates.find(u => u.id === c.id);
                return update ? { ...c, status: 'failed' } : c;
              })
            );
            

          }
        } catch (overdueError) {
          console.error('❌ Error checking overdue confirmations:', overdueError);
        }

        // Phase 4: Load photo albums
        try {
          const photoAlbumsData = await fetchPhotoAlbums();
          setPhotoAlbums(photoAlbumsData || []);
          // Debug: Log photo albums loaded (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('📸 Photo albums loaded:', photoAlbumsData?.length || 0);
          }
        } catch (albumError) {
          console.warn('⚠️ Failed to load photo albums:', albumError);
          setPhotoAlbums([]);
        }


      } catch (error) {
        console.error('❌ Error loading data from NocoDB:', error);
        setCorrectPassword(null);
        setProfileData({ introduce: '', caption: '', skills: [], hobbies: [], id: null });
        setProfileLoaded(true);
        setAllQuests([]);
        setAvailableQuests([]);
        setQuestConfirmations([]);
        setAllAchievements([]);
        setAvailableAchievements([]);
        setAchievementConfirmations([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    setIsRefreshing(true);

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
    const pool = Array.isArray(existingDoings) ? existingDoings : [];
    
    if (!q) {
      setDoingSuggestions(pool.slice(0, 10));
      return;
    }
    const suggestions = pool.filter(d => d.toLowerCase().includes(q) || d.toLowerCase().startsWith(q));
    setDoingSuggestions(suggestions.slice(0, 10));
    setDoingOpen(suggestions.length > 0);
  };

  const openDoingDropdown = () => {
    // Show all available options on focus/click
    const pool = Array.isArray(existingDoings) ? existingDoings : [];
    const list = pool.slice(0, 10);
    setDoingSuggestions(list);
    setDoingOpen(list.length > 0);
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


      // Save journal entry for skill addition
      try {
        await saveProfileChangeJournal('added', 'skill', skill, CHARACTER_ID);
      } catch (journalError) {
        console.warn('⚠️ Failed to save skill addition journal:', journalError);
      }
    } else if (skill && profileData.skills.includes(skill)) {

    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));


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


      // Save journal entry for hobby addition
      try {
        await saveProfileChangeJournal('added', 'hobby', hobby, CHARACTER_ID);
      } catch (journalError) {
        console.warn('⚠️ Failed to save hobby addition journal:', journalError);
      }
    } else if (hobby && profileData.hobbies.includes(hobby)) {

    }
  };

  const handleRemoveHobby = async (hobbyToRemove) => {
    setProfileData(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(hobby => hobby !== hobbyToRemove)
    }));


    // Save journal entry for hobby removal
    try {
      await saveProfileChangeJournal('removed', 'hobby', hobbyToRemove, CHARACTER_ID);
    } catch (journalError) {
      console.warn('⚠️ Failed to save hobby removal journal:', journalError);
    }
  };

  const hasValidAlbumImages = () => albumImages.every((img) => !!img?.file);
  const hasValidGalleryImages = () => galleryImages.every((img) => !!img?.file);

  const validateAlbumSection = () => {
    const hasAlbumDescription = formData.albumDescription.trim().length > 0;
    const hasImages = albumImages.length > 0;
    const imagesAreValid = hasValidAlbumImages();

    if (hasAlbumDescription && !hasImages) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'missing image for album',
        message: 'please add at least one image before submitting the Photo Album section.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return false;
    }

    if (hasImages && !imagesAreValid) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'invalid image for album',
        message: 'some images in the album list are missing files. Please reload the images and try again.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return false;
    }

    return true;
  };

  const validateGallerySection = () => {
    const hasGalleryDescription = formData.galleryDescription?.trim().length > 0;
    const hasImages = galleryImages.length > 0;
    const imagesAreValid = hasValidGalleryImages();

    if (hasGalleryDescription && !hasImages) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'missing image for gallery',
        message: 'please add at least one image before submitting the Gallery section.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return false;
    }

    if (hasImages && !imagesAreValid) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'invalid image for gallery',
        message: 'some images in the gallery list are missing files. Please reload the images and try again.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateAlbumSection() || !validateGallerySection()) {
      return;
    }

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

      // Submit Profile Update (if has changes)
      const hasProfileChanges = 
        formData.introduce.trim() !== originalProfileData.introduce ||
        formData.caption.trim() !== originalProfileData.caption ||
        JSON.stringify(profileData.skills) !== JSON.stringify(originalProfileData.skills) ||
        JSON.stringify(profileData.hobbies) !== JSON.stringify(originalProfileData.hobbies);

      if (hasProfileChanges) {
        try {
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

            // Invalidate cache and cooldown, notify Home to refresh immediately
            try { clearCache(); } catch { }
            try { clearRefreshCooldown(); } catch { }
            try { clearNocoDBCache(); } catch { }
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
            try { clearRefreshCooldown(); } catch { }
            try { clearNocoDBCache(); } catch { }
            try { window.dispatchEvent(new Event('meo:refresh')); } catch { }
          } else {
            results.push({ type: 'failed', item: 'Journal' });
          }
        } catch (error) {
          console.error('❌ Error saving journal:', error);
          results.push({ type: 'failed', item: 'Journal' });
        }
      }

      // Submit Photo Album (if has images)
      if (albumImages.length > 0) {
        if (!hasValidAlbumImages()) {
          results.push({ type: 'failed', item: 'Photo Album (missing files)' });
        } else {
          try {
            const albumResult = await savePhotoAlbum({
              description: formData.albumDescription,
              imageFiles: albumImages.map(img => img.file)
            });

            if (albumResult.success) {
              results.push({
                type: 'success',
                item: `Photo Album (${albumResult.uploadedCount}/${albumResult.totalCount} images)`
              });

              // Clear album form after successful upload
              setAlbumImages([]);
              setFormData(prev => ({ ...prev, albumDescription: '' }));

              // Notify PhotoAlbumTab to refresh
              try {
                window.dispatchEvent(new Event('photoalbum:refresh'));
              } catch (eventError) {
                console.warn('⚠️ Could not dispatch photo album refresh event:', eventError);
              }
            } else {
              results.push({ type: 'failed', item: 'Photo Album' });
            }
          } catch (error) {
            console.error('❌ Error saving photo album:', error);
            results.push({ type: 'failed', item: 'Photo Album' });
          }
        }
      }

      // Submit Profile Gallery (if has images)
      if (galleryImages.length > 0 && profileData.id) {
        try {
          const galleryResult = await uploadProfileGalleryImages(profileData.id, galleryImages.map(img => img.file));

          if (galleryResult.success) {
            results.push({
              type: 'success',
              item: `Profile Gallery (${galleryResult.uploadedCount}/${galleryResult.totalCount} images)`
            });

            setGalleryImages([]);
            setFormData(prev => ({ ...prev, galleryDescription: '' }));
          } else {
            results.push({ type: 'failed', item: 'Profile Gallery' });
          }
        } catch (error) {
          console.error('❌ Error uploading profile gallery images:', error);
          results.push({ type: 'failed', item: 'Profile Gallery' });
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

          // Save confirmation to NocoDB (with image upload to attachments_gallery)
          // Pass quest creation date and auto-approve flag for overdue check
          try {
            // Find the quest to get its creation date
            const quest = allQuests.find(q => q.id === submission.questId);
            
            const questConfirmResult = await saveQuestConfirmation({
              questId: submission.questId,
              questName: submission.questTitle,
              desc: submission.description || '',
              imageFile: submission.image, // Pass the File object directly
              questCreatedAt: quest?.createdAt, // Pass quest creation date for overdue check
              autoApprove: autoApproveTasks // Pass auto-approve flag
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
                  createdAt: new Date(),
                  status: questConfirmResult.autoApproved ? 'completed' : 'pending'
                }];
              });

            }

            // Persist across blocks to evaluate after admin notify
            let xpResult = null;
            // Only auto-complete if the confirmation was auto-approved (not overdue)
            if (autoApproveTasks && questConfirmResult.shouldAutoComplete) {
              try {
                await updateQuest(submission.questId, { completedAt: new Date() });
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
              try { clearRefreshCooldown(); } catch { }
              try { clearNocoDBCache(); } catch { }

              // Optimistically update UI for auto-approve
              setAllQuests(prev => prev.map(q => q.id === submission.questId ? { ...q, completedAt: new Date() } : q));
              setAvailableQuests(prev => prev.filter(q => q.id !== submission.questId));
              didAutoApprove = true;
              

            } else if (autoApproveTasks && !questConfirmResult.shouldAutoComplete) {

            }

            // Send Discord notification for quest submission
            try {
              const questData = {
                name: submission.questTitle,
                nameTranslations: submission.questNameTranslations || {},
                xp: submission.questXp || 0,
                desc: submission.questDesc || '',
                descTranslations: submission.questDescTranslations || {}
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

            // Then notify admin (only when auto-approve is ON and quest was auto-completed) to ensure ordering
            if (autoApproveTasks && questConfirmResult.shouldAutoComplete) {
              try {
                await sendAdminQuestCompletedNotification(
                  { 
                    name: submission.questTitle, 
                    nameTranslations: submission.questNameTranslations || {},
                    desc: submission.questDesc || '', 
                    descTranslations: submission.questDescTranslations || {},
                    xp: submission.questXp || 0 
                  },
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

          let uploadWarning = '';

          // Save confirmation to NocoDB (with image upload to attachments_gallery)
          // Pass achievement due date and auto-approve flag for overdue check
          try {
            // Find the achievement to get its due date
            const achievement = allAchievements.find(a => a.id === submission.achievementId);
            
            const achConfirmResult = await saveAchievementConfirmation({
              achievementId: submission.achievementId,
              achievementName: submission.achievementTitle,
              desc: submission.description || '',
              imageFile: submission.image, // Pass the File object directly
              achievementDueDate: achievement?.dueDate, // Pass achievement due date for overdue check
              autoApprove: autoApproveTasks // Pass auto-approve flag
            });

            // Optimistically update UI - add confirmation to state immediately
            if (achConfirmResult?.id) {
              setAchievementConfirmations(prev => {
                const rest = prev.filter(c => c.achievementsId !== submission.achievementId);
                return [...rest, { 
                  id: achConfirmResult.id, 
                  achievementName: submission.achievementTitle, 
                  desc: submission.description || '', 
                  imageUrl: null, // Image URL will be available after fetch
                  achievementsId: submission.achievementId,
                  createdAt: new Date(),
                  status: achConfirmResult.autoApproved ? 'completed' : 'pending'
                }];
              });

            }

            // Persist across blocks to evaluate after admin notify
            let xpResult = null;
            // Only auto-complete if the confirmation was auto-approved (not overdue)
            if (autoApproveTasks && achConfirmResult.shouldAutoComplete) {
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
              try { clearRefreshCooldown(); } catch { }
              try { clearNocoDBCache(); } catch { }

              // Optimistically update UI for auto-approve
              setAllAchievements(prev => prev.map(a => a.id === submission.achievementId ? { ...a, completedAt: new Date() } : a));
              setAvailableAchievements(prev => prev.filter(a => a.id !== submission.achievementId));
              didAutoApprove = true;
              

            } else if (autoApproveTasks && !achConfirmResult.shouldAutoComplete) {

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
                imgUrl: '' // Image URL will be generated by NocoDB
              };

              await sendAchievementNotification(achievementData, userData, confirmationData);
            } catch (discordError) {
              console.warn('⚠️ Discord notification failed:', discordError);
              // Don't fail the entire submission if Discord fails
            }

            // Then notify admin (only when auto-approve is ON and achievement was auto-completed) to ensure ordering
            if (autoApproveTasks && achConfirmResult.shouldAutoComplete) {
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
                  { desc: submission.description || '', imgUrl: '' }
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
          // Reload data after successful submit
          reloadDataAfterSubmit();
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

  // Quest submission handlers
  const handleAddQuestSubmission = (quest) => {
    const newIndex = selectedQuestSubmissions.length;
    setSelectedQuestSubmissions(prev => [...prev, {
      questId: quest.id,
      questTitle: quest.name,
      questNameTranslations: quest.nameTranslations || {},
      questDesc: quest.desc || '',
      questDescTranslations: quest.descTranslations || {},
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

  // Show loading screen while data is being fetched
  if (dataLoading) {
    return <LoadingDialog />;
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
                      onFocus={openDoingDropdown}
                      onClick={openDoingDropdown}
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

          {/* Photo Album */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                setPhotoAlbumExpanded(!photoAlbumExpanded);
              }}
            >
              {photoAlbumExpanded ? '▼' : '▸'} Photo Album
            </h2>

            {photoAlbumExpanded && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="albumDescription">Album Description</label>
                  <textarea
                    id="albumDescription"
                    name="albumDescription"
                    rows="4"
                    value={formData.albumDescription}
                    onChange={handleChange}
                    placeholder="Describe your photo album..."
                  />
                </div>

                <div className="form-group">
                  <label>Photos ({albumImages.length})</label>

                  {/* Upload Button */}
                  <div className="photoalbum-upload-section">
                    <label className="photoalbum-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 0) {
                            const newImages = files.map(file => ({
                              id: Date.now() + Math.random(),
                              file,
                              preview: URL.createObjectURL(file)
                            }));
                            setAlbumImages(prev => [...prev, ...newImages]);
                          }
                          e.target.value = '';
                        }}
                      />
                      📷 Add Photos
                    </label>
                    <p className="photoalbum-upload-hint">Click to select multiple photos</p>
                  </div>

                  {/* Image Grid */}
                  {albumImages.length > 0 && (
                    <div className="photoalbum-grid">
                      {albumImages.map((image) => (
                        <div key={image.id} className="photoalbum-item">
                          <img src={image.preview} alt="Album preview" className="photoalbum-preview" />
                          <button
                            type="button"
                            className="photoalbum-remove-btn"
                            onClick={() => {
                              URL.revokeObjectURL(image.preview);
                              setAlbumImages(prev => prev.filter(img => img.id !== image.id));
                            }}
                            aria-label="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {albumImages.length === 0 && (
                    <div className="photoalbum-empty">
                      <p>No photos added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Gallery */}
          <div className="form-section">
            <h2
              className="section-title clickable"
              onClick={() => {
                setGalleryExpanded(!galleryExpanded);
              }}
            >
              {galleryExpanded ? '▼' : '▸'} Gallery
            </h2>

            {galleryExpanded && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="galleryDescription">Gallery Description</label>
                  <textarea
                    id="galleryDescription"
                    name="galleryDescription"
                    rows="3"
                    value={formData.galleryDescription || ''}
                    onChange={handleChange}
                    placeholder="Describe your gallery..."
                  />
                </div>

                <div className="form-group">
                  <label>New Photos ({galleryImages.length})</label>

                  {/* Upload Button */}
                  <div className="userpage-gallery-upload-section">
                    <label className="userpage-gallery-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const newImages = files.map(file => ({
                              id: Date.now() + Math.random(),
                              file,
                              preview: URL.createObjectURL(file)
                            }));
                            setGalleryImages(prev => [...prev, ...newImages]);
                          }
                          e.target.value = '';
                        }}
                      />
                      📷 Add Gallery Photos
                    </label>
                    <p className="userpage-gallery-upload-hint">Click to select multiple photos</p>
                  </div>

                  {/* Image Grid for new uploads */}
                  {galleryImages.length > 0 && (
                    <div className="userpage-gallery-grid">
                      {galleryImages.map((image) => (
                        <div key={image.id} className="userpage-gallery-item">
                          <img src={image.preview} alt="Gallery preview" className="userpage-gallery-preview" />
                          <button
                            type="button"
                            className="userpage-gallery-remove-btn"
                            onClick={() => {
                              URL.revokeObjectURL(image.preview);
                              setGalleryImages(prev => prev.filter(img => img.id !== image.id));
                            }}
                            aria-label="Remove gallery photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {galleryImages.length === 0 && (
                    <div className="userpage-gallery-empty">
                      <p>No new gallery photos added yet</p>
                    </div>
                  )}
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


