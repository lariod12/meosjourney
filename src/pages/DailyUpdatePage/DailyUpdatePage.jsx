import { useState, useEffect, useRef } from 'react';
import './DailyUpdatePage.css';
import {
  fetchConfig,
  saveStatus,
  saveJournal,
  fetchQuests,
  fetchQuestConfirmations,
  saveQuestConfirmation,
  getQuestConfirmation,
  fetchAchievements,
  fetchAchievementConfirmations,
  saveAchievementConfirmation,
  getAchievementConfirmation,
  CHARACTER_ID
} from '../../services/firestore';
import { uploadQuestConfirmImage, uploadAchievementConfirmImage, deleteImageByUrl } from '../../services/storage';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import IconRenderer from '../../components/IconRenderer/IconRenderer';

const SESSION_KEY = 'meos05_access';

const DailyUpdate = ({ onBack }) => {
  const [moodOptions, setMoodOptions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [correctPassword, setCorrectPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    noteDate: new Date().toISOString().split('T')[0],
    doing: '',
    location: '',
    mood: '',
    journalEntry: ''
  });

  // Daily Quests Update states
  const [availableQuests, setAvailableQuests] = useState([]);
  const [questConfirmations, setQuestConfirmations] = useState([]);
  const [selectedQuestSubmissions, setSelectedQuestSubmissions] = useState([]);
  const [showQuestDropdown, setShowQuestDropdown] = useState(false);
  const questDropdownRef = useRef(null);

  // Achievements Update states
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [achievementConfirmations, setAchievementConfirmations] = useState([]);
  const [selectedAchievementSubmissions, setSelectedAchievementSubmissions] = useState([]);
  const [showAchievementDropdown, setShowAchievementDropdown] = useState(false);
  const achievementDropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingQuestIndex, setUploadingQuestIndex] = useState(-1);
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
  const [moodOpen, setMoodOpen] = useState(false);

  // Collapse/expand states - collapsed by default
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);

  useEffect(() => {
    // Load config, quests, achievements, and confirmations from Firestore
    Promise.all([
      fetchConfig(CHARACTER_ID),
      fetchQuests(CHARACTER_ID),
      fetchQuestConfirmations(CHARACTER_ID),
      fetchAchievements(CHARACTER_ID),
      fetchAchievementConfirmations(CHARACTER_ID)
    ])
      .then(([cfg, quests, questConfirms, achievements, achievementConfirms]) => {
        setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);
        setCorrectPassword(cfg?.pwDailyUpdate || null);

        // Filter only incomplete quests (completedAt === null)
        const availableQuests = quests.filter(q => q.completedAt === null);
        setAvailableQuests(availableQuests);
        setQuestConfirmations(questConfirms);

        // Filter only incomplete achievements (completedAt === null)
        const availableAchievements = achievements.filter(a => a.completedAt === null);
        setAvailableAchievements(availableAchievements);
        setAchievementConfirmations(achievementConfirms);
      })
      .catch((error) => {
        console.error('❌ Error loading data:', error);
        setMoodOptions([]);
        setCorrectPassword(null);
        setAvailableQuests([]);
        setQuestConfirmations([]);
        setAvailableAchievements([]);
        setAchievementConfirmations([]);
      });
  }, []);

  // Refresh data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    setIsRefreshing(true);

    try {
      const [cfg, quests, questConfirms, achievements, achievementConfirms] = await Promise.all([
        fetchConfig(CHARACTER_ID),
        fetchQuests(CHARACTER_ID),
        fetchQuestConfirmations(CHARACTER_ID),
        fetchAchievements(CHARACTER_ID),
        fetchAchievementConfirmations(CHARACTER_ID)
      ]);

      setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);

      // Filter only incomplete quests
      const availableQuests = quests.filter(q => q.completedAt === null);
      setAvailableQuests(availableQuests);
      setQuestConfirmations(questConfirms);

      // Filter only incomplete achievements
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Submit Status Update (if has data)
      const hasStatusData = formData.doing.trim() || formData.location.trim() || formData.mood.trim();

      if (hasStatusData) {
        const statusResult = await saveStatus({
          doing: formData.doing,
          location: formData.location,
          mood: formData.mood
        }, CHARACTER_ID);

        if (statusResult.success) {
          results.push('Status Update');
        } else {
          console.warn('⚠️ Status not saved:', statusResult.message);
        }
      }

      // Submit Journal Entry (if has content)
      if (formData.journalEntry.trim()) {
        const journalResult = await saveJournal({
          caption: formData.journalEntry
        }, CHARACTER_ID);

        if (journalResult.success) {
          results.push('Journal Entry');
        }
      }

      // Submit Quest Confirmations (if has submissions)
      if (selectedQuestSubmissions.length > 0) {

        for (let i = 0; i < selectedQuestSubmissions.length; i++) {
          const submission = selectedQuestSubmissions[i];
          setUploadingQuestIndex(i);

          try {
            let imgUrl = '';

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

            // 2. Upload new image to Storage if exists
            if (submission.image) {
              const uploadResult = await uploadQuestConfirmImage(
                submission.image,
                submission.questTitle
              );
              imgUrl = uploadResult.url;
            }

            // 3. Save confirmation to quests-confirm collection (will override if exists)
            await saveQuestConfirmation({
              name: submission.questTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            }, CHARACTER_ID);

            results.push(`Quest: ${submission.questTitle}`);

          } catch (error) {
            console.error('❌ Error processing quest submission:', submission.questTitle, error);
            // Continue with other quests even if one fails
            results.push(`Quest: ${submission.questTitle} (failed)`);
          }
        }

        setUploadingQuestIndex(-1);
      }

      // Submit Achievement Confirmations (if has submissions)
      if (selectedAchievementSubmissions.length > 0) {

        for (let i = 0; i < selectedAchievementSubmissions.length; i++) {
          const submission = selectedAchievementSubmissions[i];
          setUploadingQuestIndex(i); // Reuse same state for progress indicator

          try {
            let imgUrl = '';

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

            // 2. Upload new image to Storage if exists
            if (submission.image) {
              const uploadResult = await uploadAchievementConfirmImage(
                submission.image,
                submission.achievementTitle
              );
              imgUrl = uploadResult.url;
            }

            // 3. Save confirmation to achievements-confirm collection (will override if exists)
            await saveAchievementConfirmation({
              name: submission.achievementTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            }, CHARACTER_ID);

            results.push(`Achievement: ${submission.achievementTitle}`);

          } catch (error) {
            console.error('❌ Error processing achievement submission:', submission.achievementTitle, error);
            // Continue with other achievements even if one fails
            results.push(`Achievement: ${submission.achievementTitle} (failed)`);
          }
        }

        setUploadingQuestIndex(-1);
      }

      // Show success message
      if (results.length > 0) {
        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: `${results.join(', ')} saved successfully!`,
          confirmText: 'OK',
          cancelText: null, // No cancel button for success
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            // Reset form after successful submit
            setFormData(prev => ({
              ...prev,
              doing: '',
              location: '',
              mood: moodOptions[0] || '',
              journalEntry: ''
            }));
            // Clear quest and achievement submissions
            setSelectedQuestSubmissions([]);
            setSelectedAchievementSubmissions([]);
            // Reload quests and achievements to update available lists
            Promise.all([
              fetchQuests(CHARACTER_ID),
              fetchAchievements(CHARACTER_ID)
            ]).then(([quests, achievements]) => {
              // Filter only incomplete quests
              const availableQuests = quests.filter(q => q.completedAt === null);
              setAvailableQuests(availableQuests);

              // Filter only incomplete achievements
              const availableAchievements = achievements.filter(a => a.completedAt === null);
              setAvailableAchievements(availableAchievements);
            });
          }
        });
      } else {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'No Data',
          message: 'No data to save. Please fill in at least one field.',
          confirmText: 'OK',
          cancelText: null, // No cancel button for warning
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
      journalEntry: ''
    });
    setSelectedQuestSubmissions([]);
    setSelectedAchievementSubmissions([]);
  };

  // Quest submission handlers
  const handleAddQuestSubmission = (quest) => {
    console.log('➕ Adding quest submission:', quest.name);
    setSelectedQuestSubmissions(prev => [...prev, {
      questId: quest.id,
      questTitle: quest.name,
      questDesc: quest.desc || '',
      questXp: quest.xp,
      description: '',
      image: null,
      imagePreview: null
    }]);
    setShowQuestDropdown(false);
  };

  const handleRemoveQuestSubmission = (index) => {
    setSelectedQuestSubmissions(prev => prev.filter((_, i) => i !== index));
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
    return availableQuests.filter(q => !selectedQuestIds.includes(q.id));
  };

  // Check if quest has confirmation today
  const hasQuestConfirmation = (questName) => {
    const today = new Date();
    const todaySuffix = today.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const sanitizedName = questName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const expectedId = `${sanitizedName}_${todaySuffix}`;
    return questConfirmations.some(c => c.id === expectedId);
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
    setShowAchievementDropdown(false);
  };

  const handleRemoveAchievementSubmission = (index) => {
    console.log('➖ Removing achievement submission at index:', index);
    setSelectedAchievementSubmissions(prev => prev.filter((_, i) => i !== index));
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
    return availableAchievements.filter(a => !selectedAchievementIds.includes(a.id));
  };

  // Check if achievement has confirmation today
  const hasAchievementConfirmation = (achievementName) => {
    const today = new Date();
    const todaySuffix = today.toLocaleString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/-/g, '');

    const sanitizedName = achievementName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const expectedId = `${sanitizedName}_${todaySuffix}`;
    return achievementConfirmations.some(c => c.id === expectedId);
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
                  <input
                    type="text"
                    id="doing"
                    name="doing"
                    value={formData.doing}
                    onChange={handleChange}
                    placeholder="e.g., Studying character design"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Home, Coffee shop, Office"
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
                setQuestsExpanded(!questsExpanded);
              }}
            >
              {questsExpanded ? '▼' : '▸'} Daily Quests Update
            </h2>

            {questsExpanded && (
              <div className="section-content">
                {/* Add Quest Button */}
                <div className="quest-add-section">
                  <div className="select-wrap" ref={questDropdownRef}>
                    <button
                      type="button"
                      className="btn-add-quest"
                      onClick={() => setShowQuestDropdown(!showQuestDropdown)}
                      disabled={isSubmitting || getAvailableQuestsForDropdown().length === 0}
                    >
                      ➕ Add Completed Quest
                    </button>

                    {showQuestDropdown && getAvailableQuestsForDropdown().length > 0 && (
                      <div className="quest-dropdown">
                        {getAvailableQuestsForDropdown().map(quest => {
                          const hasConfirm = hasQuestConfirmation(quest.name);
                          return (
                            <div
                              key={quest.id}
                              className={`quest-dropdown-item ${hasConfirm ? 'has-confirmation' : ''}`}
                              onClick={() => handleAddQuestSubmission(quest)}
                            >
                              <span className="quest-dropdown-title">
                                {quest.name}
                                {hasConfirm && <span className="confirmation-badge">📝 Pending</span>}
                              </span>
                              <span className="quest-dropdown-xp">+{quest.xp} XP</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {getAvailableQuestsForDropdown().length === 0 && selectedQuestSubmissions.length === 0 && (
                    <p className="no-quests-message">No incomplete quests available</p>
                  )}
                </div>

                {/* Quest Submission Forms */}
                {selectedQuestSubmissions.map((submission, index) => {
                  const hasConfirm = hasQuestConfirmation(submission.questTitle);
                  return (
                    <div key={index} className="quest-submission-form">
                      <div className="quest-submission-header">
                        <div className="quest-submission-info">
                          <h3 className="quest-submission-title">
                            ⚔️ {submission.questTitle} <span className="quest-xp-badge">+{submission.questXp} XP</span>
                            {hasConfirm && <span className="quest-status-badge pending">📝 Pending Review</span>}
                          </h3>
                          {submission.questDesc && (
                            <p className="quest-submission-desc">{submission.questDesc}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-remove-quest"
                          onClick={() => handleRemoveQuestSubmission(index)}
                          disabled={isSubmitting}
                        >
                          ✕
                        </button>
                      </div>

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
                setAchievementsExpanded(!achievementsExpanded);
              }}
            >
              {achievementsExpanded ? '▼' : '▸'} Achievements Update
            </h2>

            {achievementsExpanded && (
              <div className="section-content">
                {/* Add Achievement Button */}
                <div className="quest-add-section">
                  <div className="select-wrap" ref={achievementDropdownRef}>
                    <button
                      type="button"
                      className="btn-add-quest"
                      onClick={() => setShowAchievementDropdown(!showAchievementDropdown)}
                      disabled={isSubmitting || getAvailableAchievementsForDropdown().length === 0}
                    >
                      ➕ Add Completed Achievement
                    </button>

                    {showAchievementDropdown && getAvailableAchievementsForDropdown().length > 0 && (
                      <div className="quest-dropdown">
                        {getAvailableAchievementsForDropdown().map(achievement => {
                          const hasConfirm = hasAchievementConfirmation(achievement.name);
                          return (
                            <div
                              key={achievement.id}
                              className={`quest-dropdown-item ${hasConfirm ? 'has-confirmation' : ''}`}
                              onClick={() => handleAddAchievementSubmission(achievement)}
                            >
                              <span className="quest-dropdown-title">
                                {achievement.icon && (
                                  <IconRenderer iconName={achievement.icon} size={20} />
                                )}
                                {' '}{achievement.name}
                                {hasConfirm && <span className="confirmation-badge">📝 Pending</span>}
                                {achievement.dueDate && <span className="confirmation-badge">📅 {achievement.dueDate}</span>}
                              </span>
                              <span className="quest-dropdown-xp">
                                {achievement.xp > 0 && `+${achievement.xp} XP`}
                                {achievement.specialReward && ` 🎁 ${achievement.specialReward}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {getAvailableAchievementsForDropdown().length === 0 && selectedAchievementSubmissions.length === 0 && (
                    <p className="no-quests-message">No incomplete achievements available</p>
                  )}
                </div>

                {/* Achievement Submission Forms */}
                {selectedAchievementSubmissions.map((submission, index) => {
                  const hasConfirm = hasAchievementConfirmation(submission.achievementTitle);
                  return (
                    <div key={index} className="quest-submission-form">
                      <div className="quest-submission-header">
                        <div className="quest-submission-info">
                          <h3 className="quest-submission-title">
                            {submission.achievementIcon && (
                              <IconRenderer iconName={submission.achievementIcon} size={24} />
                            )}
                            {' '}{submission.achievementTitle}
                            {submission.achievementXp > 0 && <span className="quest-xp-badge">+{submission.achievementXp} XP</span>}
                            {submission.achievementSpecialReward && <span className="quest-xp-badge">🎁 {submission.achievementSpecialReward}</span>}
                            {hasConfirm && <span className="quest-status-badge pending">📝 Pending Review</span>}
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
                          onClick={() => handleRemoveAchievementSubmission(index)}
                          disabled={isSubmitting}
                        >
                          ✕
                        </button>
                      </div>

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
                  );
                })}
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

export default DailyUpdate;

