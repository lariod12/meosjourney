import { useState, useEffect, useRef } from 'react';
import './UserPage.css';
import {
  fetchConfig,
  fetchStatus,
  fetchProfile,
  saveStatus,
  saveProfile,
  saveJournal,
  fetchQuests,
  fetchQuestConfirmations,
  saveQuestConfirmation,
  getQuestConfirmation,
  fetchAchievements,
  fetchAchievementConfirmations,
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
import { sendQuestSubmissionNotification, sendAchievementNotification, sendAdminQuestCompletedNotification, sendAdminAchievementCompletedNotification } from '../../services/discord';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import IconRenderer from '../../components/IconRenderer/IconRenderer';

const SESSION_KEY = 'meos05_access';

const UserPage = ({ onBack }) => {
  const [moodOptions, setMoodOptions] = useState([]);
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
    newInterest: ''
  });

  // Profile data states
  const [profileData, setProfileData] = useState({
    introduce: '',
    skills: [],
    interests: []
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

  useEffect(() => {
    // Load config, profile, quests, achievements, and confirmations from Firestore
    Promise.all([
      fetchConfig(CHARACTER_ID),
      fetchStatus(CHARACTER_ID),
      fetchProfile(CHARACTER_ID),
      fetchQuests(CHARACTER_ID),
      fetchQuestConfirmations(CHARACTER_ID),
      fetchAchievements(CHARACTER_ID),
      fetchAchievementConfirmations(CHARACTER_ID)
    ])
      .then(([cfg, statusData, profile, quests, questConfirms, achievements, achievementConfirms]) => {
        setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);
        setAutoApproveTasks(!!cfg?.auto_approve_tasks);
        setCorrectPassword(cfg?.pwDailyUpdate || null);

        // Load profile data
        if (profile) {
          const loadedSkills = Array.isArray(profile.skills) ? profile.skills : [];
          const loadedInterests = Array.isArray(profile.interests) ? profile.interests : [];
          
          setProfileData({
            introduce: profile.introduce || '',
            skills: [...loadedSkills], // Create new array to ensure reactivity
            interests: [...loadedInterests] // Create new array to ensure reactivity
          });
          setFormData(prev => ({
            ...prev,
            introduce: profile.introduce || ''
          }));
          
          console.log('✅ Profile data loaded:', {
            introduce: profile.introduce || '',
            skills: loadedSkills,
            interests: loadedInterests
          });
        }
        setProfileLoaded(true);

        // Prepare existing doings from status (array or string)
        const doingsArr = Array.isArray(statusData?.doing)
          ? statusData.doing
          : (statusData?.doing ? [statusData.doing] : []);
        // Dedupe while preserving order and cast to string
        const seen = new Set();
        const normalized = [];
        doingsArr.forEach((d) => {
          const s = String(d).trim();
          const key = s.toLowerCase();
          if (s && !seen.has(key)) { seen.add(key); normalized.push(s); }
        });
        setExistingDoings(normalized);

        // Prepare existing locations from status (array or string)
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

        // Store all quests and filter incomplete ones
        setAllQuests(quests);
        const availableQuests = quests.filter(q => q.completedAt === null);
        setAvailableQuests(availableQuests);
        setQuestConfirmations(questConfirms);

        // Store all achievements and filter incomplete ones
        setAllAchievements(achievements);
        const availableAchievements = achievements.filter(a => a.completedAt === null);
        setAvailableAchievements(availableAchievements);
        setAchievementConfirmations(achievementConfirms);
      })
      .catch((error) => {
        console.error('❌ Error loading data:', error);
        setMoodOptions([]);
        setCorrectPassword(null);
        setProfileData({ introduce: '', skills: [], interests: [] });
        setProfileLoaded(true); // Set loaded even on error to allow interaction
        setAllQuests([]);
        setAvailableQuests([]);
        setQuestConfirmations([]);
        setAllAchievements([]);
        setAvailableAchievements([]);
        setAchievementConfirmations([]);
      });
  }, []);

  // Refresh data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    setIsRefreshing(true);

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

      setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);
      setAutoApproveTasks(!!cfg?.auto_approve_tasks);

      // Update profile data
      if (profile) {
        const refreshedSkills = Array.isArray(profile.skills) ? profile.skills : [];
        const refreshedInterests = Array.isArray(profile.interests) ? profile.interests : [];
        
        setProfileData({
          introduce: profile.introduce || '',
          skills: [...refreshedSkills], // Create new array to ensure reactivity
          interests: [...refreshedInterests] // Create new array to ensure reactivity
        });
        setFormData(prev => ({
          ...prev,
          introduce: profile.introduce || ''
        }));
        
        console.log('🔄 Profile data refreshed:', {
          introduce: profile.introduce || '',
          skills: refreshedSkills,
          interests: refreshedInterests
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
    if (!formData.mood && moodOptions.length) {
      setFormData(prev => ({ ...prev, mood: moodOptions[0] }));
    }
  }, [moodOptions]);

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
    if (!q) {
      setLocationSuggestions([]);
      setLocationOpen(false);
      return;
    }
    const suggestions = existingLocations.filter(l => l.toLowerCase().includes(q) || l.toLowerCase().startsWith(q));
    setLocationSuggestions(suggestions.slice(0, 10));
    setLocationOpen(suggestions.length > 0);
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

  const handleAddInterest = async () => {
    const interest = formData.newInterest.trim();
    if (interest && !profileData.interests.includes(interest)) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
      setFormData(prev => ({ ...prev, newInterest: '' }));
      console.log('➕ Added interest:', interest, '| Current interests:', [...profileData.interests, interest]);
      
      // Save journal entry for interest addition
      try {
        await saveProfileChangeJournal('added', 'interest', interest, CHARACTER_ID);
      } catch (journalError) {
        console.warn('⚠️ Failed to save interest addition journal:', journalError);
      }
    } else if (interest && profileData.interests.includes(interest)) {
      console.log('⚠️ Interest already exists:', interest);
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
    console.log('➖ Removed interest:', interestToRemove);
    
    // Save journal entry for interest removal
    try {
      await saveProfileChangeJournal('removed', 'interest', interestToRemove, CHARACTER_ID);
    } catch (journalError) {
      console.warn('⚠️ Failed to save interest removal journal:', journalError);
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
      const hasProfileData = formData.introduce.trim() || profileData.skills.length > 0 || profileData.interests.length > 0;

      if (hasProfileData) {
        try {
          const profileResult = await saveProfile({
            introduce: formData.introduce,
            skills: profileData.skills,
            interests: profileData.interests
          }, CHARACTER_ID);

          if (profileResult.success) {
            results.push({ type: 'success', item: 'Profile Update' });
          } else if (profileResult.message === 'No data to save') {
            results.push({ type: 'success', item: 'Profile Update (no change)' });
          } else {
            console.warn('⚠️ Profile not saved:', profileResult.message);
            results.push({ type: 'failed', item: 'Profile Update' });
          }
        } catch (error) {
          console.error('❌ Error saving profile:', error);
          results.push({ type: 'failed', item: 'Profile Update' });
        }
      }

      // Submit Status Update (if has data)
      const hasStatusData = formData.doing.trim() || formData.location.trim() || formData.caption.trim() || formData.mood.trim();

      if (hasStatusData) {
        try {
          // Fetch current status and profile to detect changes
          const [currentStatus, currentProfile] = await Promise.all([
            fetchStatus(CHARACTER_ID),
            fetchProfile(CHARACTER_ID)
          ]);
          
          // Get current values (handle both array and string formats)
          const getCurrentValue = (field) => {
            if (!currentStatus || !currentStatus[field]) return '';
            return Array.isArray(currentStatus[field]) 
              ? (currentStatus[field][0] || '')
              : (currentStatus[field] || '');
          };

          const oldDoing = getCurrentValue('doing');
          const oldLocation = getCurrentValue('location');
          const oldMood = getCurrentValue('mood');
          const oldCaption = currentProfile?.caption || '';

          const statusResult = await saveStatus({
            doing: formData.doing,
            location: formData.location,
            caption: formData.caption,
            mood: formData.mood
          }, CHARACTER_ID);

          if (statusResult.success) {
            results.push({ type: 'success', item: 'Status Update' });

            // Create journal entries for changed fields
            const newDoing = formData.doing.trim();
            const newLocation = formData.location.trim();
            const newMood = formData.mood.trim();
            const newCaption = formData.caption.trim();

            // Check and save journal entry for each changed field
            if (newDoing && newDoing !== oldDoing) {
              try {
                await saveStatusChangeJournal('doing', oldDoing, newDoing, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save activity change journal:', journalError);
              }
            }

            if (newLocation && newLocation !== oldLocation) {
              try {
                await saveStatusChangeJournal('location', oldLocation, newLocation, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save location change journal:', journalError);
              }
            }

            if (newMood && newMood !== oldMood) {
              try {
                await saveStatusChangeJournal('mood', oldMood, newMood, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save mood change journal:', journalError);
              }
            }

            if (newCaption && newCaption !== oldCaption) {
              try {
                await saveStatusChangeJournal('caption', oldCaption, newCaption, CHARACTER_ID);
              } catch (journalError) {
                console.warn('⚠️ Failed to save caption change journal:', journalError);
              }
            }
          } else if (statusResult.message === 'No data to save') {
            results.push({ type: 'success', item: 'Status Update (no change)' });
          } else {
            console.warn('⚠️ Status not saved:', statusResult.message);
            results.push({ type: 'failed', item: 'Status Update' });
          }
        } catch (error) {
          console.error('❌ Error saving status:', error);
          results.push({ type: 'failed', item: 'Status Update' });
        }
      }

      // Submit Journal Entry (if has content)
      if (formData.journalEntry.trim()) {
        try {
          const journalResult = await saveJournal({
            caption: formData.journalEntry
          }, CHARACTER_ID);

          if (journalResult.success) {
            results.push({ type: 'success', item: 'Journal Entry' });
          } else {
            results.push({ type: 'failed', item: 'Journal Entry' });
          }
        } catch (error) {
          console.error('❌ Error saving journal:', error);
          results.push({ type: 'failed', item: 'Journal Entry' });
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
              name: submission.questTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            }, CHARACTER_ID);

            if (autoApproveTasks) {
              try {
                await updateQuest(submission.questId, { completedAt: new Date() }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve quest update failed:', e.message); }
              try {
                await updateProfileXP(submission.questXp || 0, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve XP update failed:', e.message); }
              try {
                await saveQuestCompletionJournal({ name: submission.questTitle, desc: submission.questDesc || '', xp: submission.questXp || 0 }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve journal save failed:', e.message); }
              try { clearCache(); } catch {}

              // Optimistically update UI
              setAllQuests(prev => prev.map(q => q.id === submission.questId ? { ...q, completedAt: new Date() } : q));
              setAvailableQuests(prev => prev.filter(q => q.id !== submission.questId));
              if (questConfirmResult?.id) {
                setQuestConfirmations(prev => {
                  const rest = prev.filter(c => c.id !== questConfirmResult.id);
                  return [...rest, { id: questConfirmResult.id, name: submission.questTitle, desc: submission.description || '', imgUrl, createdAt: new Date() }];
                });
              }
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
            }

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

            if (autoApproveTasks) {
              try {
                await updateAchievement(submission.achievementId, { completedAt: new Date() }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve achievement update failed:', e.message); }
              try {
                await updateProfileXP(submission.achievementXp || 0, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve XP update failed:', e.message); }
              try {
                await saveAchievementCompletionJournal({ name: submission.achievementTitle, desc: submission.achievementDesc || '', xp: submission.achievementXp || 0, specialReward: submission.achievementSpecialReward || '' }, CHARACTER_ID);
              } catch (e) { console.warn('⚠️ Auto-approve journal save failed:', e.message); }
              try { clearCache(); } catch {}

              // Optimistically update UI
              setAllAchievements(prev => prev.map(a => a.id === submission.achievementId ? { ...a, completedAt: new Date() } : a));
              setAvailableAchievements(prev => prev.filter(a => a.id !== submission.achievementId));
              if (achConfirmResult?.id) {
                setAchievementConfirmations(prev => {
                  const rest = prev.filter(c => c.id !== achConfirmResult.id);
                  return [...rest, { id: achConfirmResult.id, name: submission.achievementTitle, desc: submission.description || '', imgUrl, createdAt: new Date() }];
                });
              }
              didAutoApprove = true;
            }

            // Send Discord notification for achievement submission
            try {
              const achievementData = {
                name: submission.achievementTitle,
                xp: submission.achievementXp || 0,
                desc: submission.achievementDesc || '',
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
                  { name: submission.achievementTitle, desc: submission.achievementDesc || '', xp: submission.achievementXp || 0, specialReward: submission.achievementSpecialReward || '' },
                  { desc: submission.description || '', imgUrl }
                );
              } catch (e) { console.warn('⚠️ Discord admin achievement notification failed:', e); }
            }

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
        try { window.dispatchEvent(new Event('meo:refresh')); } catch {}
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
          modalMessage = `${successItems.map(r => r.item).join(', ')} saved successfully!`;
        } else if (successItems.length === 0) {
          // All failed
          modalType = 'error';
          modalTitle = 'Failed';
          modalMessage = `Failed to save: ${failedItems.map(r => r.item).join(', ')}`;
        } else {
          // Partial success
          modalType = 'warning';
          modalTitle = 'Partially Completed';
          modalMessage = `✓ Saved: ${successItems.map(r => r.item).join(', ')}\n\n✕ Failed: ${failedItems.map(r => r.item).join(', ')}`;
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

            // Only reset form if there were some successes
            if (successItems.length > 0) {
              // Reset form after successful submit
              setFormData(prev => ({
                ...prev,
                doing: '',
                location: '',
                mood: moodOptions[0] || '',
                journalEntry: '',
                newSkill: '',
                newInterest: ''
              }));
              // Clear quest and achievement submissions
              setSelectedQuestSubmissions([]);
              setSelectedAchievementSubmissions([]);
              setExpandedQuestSubmissions([]);
              setExpandedAchievementSubmissions([]);
              // Reload profile, quests, achievements, and confirmations to update available lists and review submitted
              Promise.all([
                fetchStatus(CHARACTER_ID),
                fetchProfile(CHARACTER_ID),
                fetchQuests(CHARACTER_ID),
                fetchQuestConfirmations(CHARACTER_ID),
                fetchAchievements(CHARACTER_ID),
                fetchAchievementConfirmations(CHARACTER_ID)
              ]).then(([statusData2, profile2, quests, questConfirms, achievements, achievementConfirms]) => {
            const doingsArr2 = Array.isArray(statusData2?.doing)
              ? statusData2.doing
              : (statusData2?.doing ? [statusData2.doing] : []);
            const seen2 = new Set();
            const normalized2 = [];
            doingsArr2.forEach((d) => {
              const s = String(d).trim();
              const key = s.toLowerCase();
              if (s && !seen2.has(key)) { seen2.add(key); normalized2.push(s); }
            });
            setExistingDoings(normalized2);
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
            
            // Update profile data after successful submission
            if (profile2) {
              const updatedSkills = Array.isArray(profile2.skills) ? profile2.skills : [];
              const updatedInterests = Array.isArray(profile2.interests) ? profile2.interests : [];
              
              setProfileData({
                introduce: profile2.introduce || '',
                skills: [...updatedSkills], // Create new array to ensure reactivity
                interests: [...updatedInterests] // Create new array to ensure reactivity
              });
              setFormData(prev => ({
                ...prev,
                introduce: profile2.introduce || ''
              }));
              
              console.log('✅ Profile data updated after submission:', {
                introduce: profile2.introduce || '',
                skills: updatedSkills,
                interests: updatedInterests
              });
            }
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
              });
            }
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
      mood: moodOptions[0] || '',
      journalEntry: '',
      introduce: profileData.introduce,
      newSkill: '',
      newInterest: ''
    });
    setDoingSuggestions([]);
    setDoingOpen(false);
    setLocationSuggestions([]);
    setLocationOpen(false);
    setSelectedQuestSubmissions([]);
    setSelectedAchievementSubmissions([]);
    setExpandedQuestSubmissions([]);
    setExpandedAchievementSubmissions([]);
  };

  // Quest submission handlers
  const handleAddQuestSubmission = (quest) => {
    console.log('➕ Adding quest submission:', quest.name);
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
    // Filter out quests that are already selected OR have pending confirmation
    return availableQuests.filter(q => {
      if (selectedQuestIds.includes(q.id)) return false;
      return !hasQuestConfirmation(q.name);
    });
  };

  // Check if quest has ANY confirmation (not just today)
  const hasQuestConfirmation = (questName) => {
    const sanitizedName = questName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Check if any confirmation ID starts with this quest name
    return questConfirmations.some(c => c.id.startsWith(sanitizedName + '_'));
  };

  // Get all quest submissions (quests that have confirmation)
  const getAllQuestSubmissions = () => {
    const questsWithConfirmation = availableQuests.filter(q => hasQuestConfirmation(q.name)).map(quest => {
      const confirmation = getQuestConfirmationData(quest.name);
      return {
        ...quest,
        confirmation
      };
    });
    
    return questsWithConfirmation;
  };

  // Get quest confirmation data (get the most recent one if multiple exist)
  const getQuestConfirmationData = (questName) => {
    const sanitizedName = questName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Find all confirmations for this quest
    const matchingConfirmations = questConfirmations.filter(c => c.id.startsWith(sanitizedName + '_'));

    // Return the most recent one (last in array, assuming sorted by date in ID)
    return matchingConfirmations.length > 0 ? matchingConfirmations[matchingConfirmations.length - 1] : null;
  };

  // Achievement submission handlers
  const handleAddAchievementSubmission = (achievement) => {
    console.log('➕ Adding achievement submission:', achievement.name);
    setSelectedAchievementSubmissions(prev => [...prev, {
      achievementId: achievement.id,
      achievementTitle: achievement.name,
      achievementDesc: achievement.desc || '',
      achievementIcon: achievement.icon || '',
      achievementXp: achievement.xp,
      achievementSpecialReward: achievement.specialReward || '',
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
  const hasAchievementConfirmation = (achievementName) => {
    const sanitizedName = achievementName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Check if any confirmation ID starts with this achievement name
    return achievementConfirmations.some(c => c.id.startsWith(sanitizedName + '_'));
  };

  // Get all achievement submissions (achievements that have confirmation)
  const getAllAchievementSubmissions = () => {
    const achievementsWithConfirmation = availableAchievements.filter(a => hasAchievementConfirmation(a.name)).map(achievement => {
      const confirmation = getAchievementConfirmationData(achievement.name);
      return {
        ...achievement,
        confirmation
      };
    });
    
    return achievementsWithConfirmation;
  };

  // Get achievement confirmation data (get the most recent one if multiple exist)
  const getAchievementConfirmationData = (achievementName) => {
    const sanitizedName = achievementName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Find all confirmations for this achievement
    const matchingConfirmations = achievementConfirmations.filter(c => c.id.startsWith(sanitizedName + '_'));

    // Return the most recent one (last in array, assuming sorted by date in ID)
    return matchingConfirmations.length > 0 ? matchingConfirmations[matchingConfirmations.length - 1] : null;
  };

  // Helper function to check if a submission is overdue
  const isSubmissionOverdue = (item, itemType = 'unknown') => {
    const today = new Date();
    
    if (itemType === 'quest') {
      // For quests: Check createdAt vs today (if createdAt < today then overdue)
      if (!item.createdAt) {
        return false;
      }
      
      const createdDate = new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
      const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      const isOverdue = daysDiff > 0; // If created before today, it's overdue
      
      return isOverdue;
    } else {
      // For achievements: Only check dueDate if it exists
      if (!item.dueDate) {
        return false;
      }
      
      const dueDate = new Date(item.dueDate);
      const isOverdue = today > dueDate;
      return isOverdue;
    }
  };

  // Get failed (overdue) quest submissions - quá hạn createdAt
  const getFailedQuestConfirmations = () => {
    const allSubmissions = getAllQuestSubmissions();
    const failed = allSubmissions.filter(quest => {
      // Failed nếu createdAt < today (quest được tạo trước hôm nay)
      return isSubmissionOverdue(quest, 'quest');
    });
    return failed;
  };

  // Get completed quest submissions - có completedAt != null trong quests collection VÀ có confirmation
  const getCompletedQuestConfirmations = () => {
    // Lấy tất cả quests có completedAt != null từ allQuests
    const completedQuests = allQuests.filter(quest => {
      const hasCompleted = quest.completedAt !== null && quest.completedAt !== undefined;
      const hasConfirmation = hasQuestConfirmation(quest.name);
      return hasCompleted && hasConfirmation;
    });
    
    // Map với confirmation data
    const completed = completedQuests.map(quest => {
      const confirmation = getQuestConfirmationData(quest.name);
      return {
        ...quest,
        confirmation
      };
    });
    
    return completed;
  };

  // Get pending quest submissions - có confirmation nhưng chưa completed và chưa quá hạn
  const getActivePendingQuestConfirmations = () => {
    const allSubmissions = getAllQuestSubmissions();
    const activePending = allSubmissions.filter(quest => {
      // Pending nếu: chưa completed VÀ chưa quá hạn createdAt
      const isNotCompleted = !quest.completedAt;
      const isNotOverdue = !isSubmissionOverdue(quest, 'quest');
      return isNotCompleted && isNotOverdue;
    });
    return activePending;
  };

  // Get failed (overdue) achievement submissions - chỉ quá hạn dueDate nếu có
  const getFailedAchievementConfirmations = () => {
    const allSubmissions = getAllAchievementSubmissions();
    const failed = allSubmissions.filter(achievement => {
      // Failed chỉ khi có dueDate và đã quá hạn (nếu dueDate null thì vẫn còn hạn)
      return achievement.dueDate && isSubmissionOverdue(achievement, 'achievement');
    });
    return failed;
  };

  // Get completed achievement submissions - có completedAt != null trong achievements collection VÀ có confirmation
  const getCompletedAchievementConfirmations = () => {
    // Lấy tất cả achievements có completedAt != null từ allAchievements
    const completedAchievements = allAchievements.filter(achievement => {
      const hasCompleted = achievement.completedAt !== null && achievement.completedAt !== undefined;
      const hasConfirmation = hasAchievementConfirmation(achievement.name);
      return hasCompleted && hasConfirmation;
    });
    
    // Map với confirmation data
    const completed = completedAchievements.map(achievement => {
      const confirmation = getAchievementConfirmationData(achievement.name);
      return {
        ...achievement,
        confirmation
      };
    });
    
    return completed;
  };

  // Get pending achievement submissions - có confirmation nhưng chưa completed và chưa quá hạn
  const getActivePendingAchievementConfirmations = () => {
    const allSubmissions = getAllAchievementSubmissions();
    const activePending = allSubmissions.filter(achievement => {
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
                console.log('Profile Update section clicked');
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
                  <label htmlFor="newInterest">Interests {profileData.interests.length > 0 && `(${profileData.interests.length})`}</label>
                  <div className="userpage-skill-input-section">
                    <input
                      type="text"
                      id="newInterest"
                      name="newInterest"
                      value={formData.newInterest}
                      onChange={handleChange}
                      placeholder="Add an interest..."
                      disabled={!profileLoaded}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="userpage-add-btn"
                      onClick={handleAddInterest}
                      disabled={!profileLoaded || !formData.newInterest.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {profileData.interests.length > 0 && (
                    <div className="userpage-tags-container">
                      {profileData.interests.map((interest, index) => (
                        <div key={index} className="userpage-tag">
                          <span>{interest}</span>
                          <button
                            type="button"
                            className="userpage-tag-remove"
                            onClick={() => handleRemoveInterest(interest)}
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
                    />
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
                  <label htmlFor="caption">Caption</label>
                  <input
                    type="text"
                    id="caption"
                    name="caption"
                    value={formData.caption}
                    onChange={handleChange}
                    placeholder="e.g., Forever Curios"
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mood">Mood</label>
                  <div className="select-wrap" ref={moodRef}>
                    <button
                      type="button"
                      id="mood"
                      className="select-display"
                      aria-haspopup="listbox"
                      aria-expanded={moodOpen}
                      onClick={() => setMoodOpen(o => !o)}
                    >
                      {formData.mood || 'Select mood'}
                      <span className="select-caret">▾</span>
                    </button>
                    {moodOpen && (
                      <div className="select-options" role="listbox">
                        {moodOptions.map(opt => (
                          <div
                            key={opt}
                            role="option"
                            aria-selected={formData.mood === opt}
                            className={`select-option${formData.mood === opt ? ' selected' : ''}`}
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, mood: opt }));
                              setMoodOpen(false);
                            }}
                          >
                            {opt}
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
                console.log('Daily Quests Update section clicked');
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
                          {getAvailableAchievementsForDropdown().map(achievement => (
                            <div
                              key={achievement.id}
                              className="quest-dropdown-item"
                              onClick={() => handleAddAchievementSubmission(achievement)}
                            >
                              <span className="quest-dropdown-title">
                                {achievement.icon && (
                                  <IconRenderer iconName={achievement.icon} size={20} />
                                )}
                                {' '}{achievement.name}
                                {achievement.dueDate && <span className="confirmation-badge">📅 {achievement.dueDate}</span>}
                              </span>
                              <span className="quest-dropdown-xp">
                                {achievement.xp > 0 && `+${achievement.xp} XP`}
                                {achievement.specialReward && ` 🎁 ${achievement.specialReward}`}
                              </span>
                            </div>
                          ))}
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
                            <p className="quest-submission-desc">📅 Due: {submission.achievementDueDate}</p>
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

                                return (
                                  <div key={achievement.id} className="pending-item">
                                    <div className="pending-item-header">
                                      <span className="pending-item-title">
                                        {achievement.icon && (
                                          <IconRenderer iconName={achievement.icon} size={20} />
                                        )}
                                        {' '}{achievement.name}
                                      </span>
                                      <span className="pending-item-badge pending">Pending</span>
                                    </div>
                                    <div className="pending-item-details">
                                      <span className="pending-item-xp">
                                        {achievement.xp > 0 && `+${achievement.xp} XP`}
                                        {achievement.specialReward && ` 🎁 ${achievement.specialReward}`}
                                      </span>
                                      {formattedDate && (
                                        <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                      )}
                                      {achievement.dueDate && (
                                        <p className="pending-item-desc">📅 Due: {achievement.dueDate}</p>
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

                  {/* Failed (Overdue) Group - Always show */}
                  <div className="review-group">
                    <h3 
                      className="review-group-title clickable failed"
                      onClick={() => {
                        setFailedGroupExpanded(!failedGroupExpanded);
                      }}
                    >
                      {failedGroupExpanded ? '▼' : '▸'} ❌ Failed (Overdue) ({getFailedQuestConfirmations().length + getFailedAchievementConfirmations().length})
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
                                          <p className="pending-item-date overdue">⚠️ Due: {quest.dueDate} (Overdue)</p>
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

                                  return (
                                    <div key={achievement.id} className="pending-item failed">
                                      <div className="pending-item-header">
                                        <span className="pending-item-title">
                                          {achievement.icon && (
                                            <IconRenderer iconName={achievement.icon} size={20} />
                                          )}
                                          {' '}{achievement.name}
                                        </span>
                                        <span className="pending-item-badge failed">Failed</span>
                                      </div>
                                      <div className="pending-item-details">
                                        <span className="pending-item-xp">
                                          {achievement.xp > 0 && `+${achievement.xp} XP`}
                                          {achievement.specialReward && ` 🎁 ${achievement.specialReward}`}
                                        </span>
                                        {formattedDate && (
                                          <p className="pending-item-date">📅 Submitted: {formattedDate}</p>
                                        )}
                                        {achievement.dueDate && (
                                          <p className="pending-item-date overdue">⚠️ Due: {achievement.dueDate} (Overdue)</p>
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

                                  return (
                                    <div key={achievement.id} className="pending-item completed">
                                      <div className="pending-item-header">
                                        <span className="pending-item-title">
                                          {achievement.icon && (
                                            <IconRenderer iconName={achievement.icon} size={20} />
                                          )}
                                          {' '}{achievement.name}
                                        </span>
                                        <span className="pending-item-badge completed">Completed</span>
                                      </div>
                                      <div className="pending-item-details">
                                        <span className="pending-item-xp">
                                          {achievement.xp > 0 && `+${achievement.xp} XP`}
                                          {achievement.specialReward && ` 🎁 ${achievement.specialReward}`}
                                        </span>
                                        {formattedSubmittedDate && (
                                          <p className="pending-item-date">📅 Submitted: {formattedSubmittedDate}</p>
                                        )}
                                        {formattedCompletedDate && (
                                          <p className="pending-item-date completed">✅ Completed: {formattedCompletedDate}</p>
                                        )}
                                        {achievement.dueDate && (
                                          <p className="pending-item-desc">📅 Due: {achievement.dueDate}</p>
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

