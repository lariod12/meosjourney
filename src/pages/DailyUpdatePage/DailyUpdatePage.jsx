import { useState, useEffect, useRef } from 'react';
import './DailyUpdatePage.css';
import { 
  fetchConfig, 
  saveStatus, 
  saveJournal, 
  fetchQuests, 
  fetchQuestConfirmations,
  saveQuestConfirmation,
  CHARACTER_ID 
} from '../../services/firestore';
import { uploadQuestConfirmImage } from '../../services/storage';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

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
  const [selectedQuestSubmissions, setSelectedQuestSubmissions] = useState([]);
  const [showQuestDropdown, setShowQuestDropdown] = useState(false);
  const questDropdownRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingQuestIndex, setUploadingQuestIndex] = useState(-1);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });

  const moodRef = useRef(null);
  const [moodOpen, setMoodOpen] = useState(false);
  
  // Collapse/expand states - collapsed by default
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [questsExpanded, setQuestsExpanded] = useState(false);

  useEffect(() => {
    // Load config, quests, and quest confirmations from Firestore
    Promise.all([
      fetchConfig(CHARACTER_ID),
      fetchQuests(CHARACTER_ID),
      fetchQuestConfirmations(CHARACTER_ID)
    ])
      .then(([cfg, quests, confirmations]) => {
        setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);
        setCorrectPassword(cfg?.pwDailyUpdate || null);
        
        // Create a Set of quest names that have confirmations (today)
        // Quest confirmation ID format: {sanitized_name}_{YYMMDD}
        const today = new Date();
        const todaySuffix = today.toLocaleString('sv-SE', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        }).replace(/-/g, '');
        
        const confirmedQuestNames = new Set(
          confirmations
            .filter(c => c.id.endsWith(`_${todaySuffix}`))
            .map(c => c.name)
        );
        
        console.log('📋 Quest confirmations today:', confirmedQuestNames.size);
        
        // Filter quests that:
        // 1. Don't have confirmation yet today
        // 2. Are not completed (completedAt === null)
        const availableQuests = quests.filter(q => 
          !confirmedQuestNames.has(q.name) && q.completedAt === null
        );
        setAvailableQuests(availableQuests);
        console.log('📋 Available quests (not confirmed today & not completed):', availableQuests.length);
      })
      .catch((error) => {
        console.error('❌ Error loading data:', error);
        setMoodOptions([]);
        setCorrectPassword(null);
        setAvailableQuests([]);
      });
  }, []);

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

    setIsSubmitting(true);

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
          console.log('✅ Status saved:', statusResult.id);
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
          console.log('✅ Journal saved:', journalResult.id);
          results.push('Journal Entry');
        }
      }

      // Submit Quest Confirmations (if has submissions)
      if (selectedQuestSubmissions.length > 0) {
        console.log('🎯 Processing quest submissions:', selectedQuestSubmissions.length);
        
        for (let i = 0; i < selectedQuestSubmissions.length; i++) {
          const submission = selectedQuestSubmissions[i];
          setUploadingQuestIndex(i);
          
          try {
            let imgUrl = '';
            
            // 1. Upload image to Storage if exists
            if (submission.image) {
              console.log(`📤 [${i + 1}/${selectedQuestSubmissions.length}] Uploading quest confirmation image for:`, submission.questTitle);
              const uploadResult = await uploadQuestConfirmImage(
                submission.image,
                submission.questTitle
              );
              imgUrl = uploadResult.url;
              console.log('✅ Image uploaded to:', uploadResult.path);
              console.log('🔗 Image URL:', imgUrl);
            }
            
            // 2. Save confirmation to quests-confirm collection
            console.log('💾 Saving quest confirmation to Firestore...');
            await saveQuestConfirmation({
              name: submission.questTitle,
              desc: submission.description || '',
              imgUrl: imgUrl
            }, CHARACTER_ID);
            console.log('✅ Quest confirmation saved for:', submission.questTitle);
            
            results.push(`Quest: ${submission.questTitle}`);
            
          } catch (error) {
            console.error('❌ Error processing quest submission:', submission.questTitle, error);
            // Continue with other quests even if one fails
            results.push(`Quest: ${submission.questTitle} (failed)`);
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
            // Clear quest submissions
            setSelectedQuestSubmissions([]);
            // Reload quests and confirmations to update available list
            Promise.all([
              fetchQuests(CHARACTER_ID),
              fetchQuestConfirmations(CHARACTER_ID)
            ]).then(([quests, confirmations]) => {
              // Filter quests that don't have confirmation today
              const today = new Date();
              const todaySuffix = today.toLocaleString('sv-SE', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
              }).replace(/-/g, '');
              
              const confirmedQuestNames = new Set(
                confirmations
                  .filter(c => c.id.endsWith(`_${todaySuffix}`))
                  .map(c => c.name)
              );
              
              // Filter quests that don't have confirmation today AND are not completed
              const availableQuests = quests.filter(q => 
                !confirmedQuestNames.has(q.name) && q.completedAt === null
              );
              setAvailableQuests(availableQuests);
              console.log('🔄 Reloaded quests, available:', availableQuests.length);
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
    console.log('➖ Removing quest submission at index:', index);
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
                      disabled={getAvailableQuestsForDropdown().length === 0}
                    >
                      ➕ Add Completed Quest
                    </button>
                    
                    {showQuestDropdown && getAvailableQuestsForDropdown().length > 0 && (
                      <div className="quest-dropdown">
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
                  </div>
                  
                  {getAvailableQuestsForDropdown().length === 0 && selectedQuestSubmissions.length === 0 && (
                    <p className="no-quests-message">No incomplete quests available</p>
                  )}
                </div>

                {/* Quest Submission Forms */}
                {selectedQuestSubmissions.map((submission, index) => (
                  <div key={index} className="quest-submission-form">
                    <div className="quest-submission-header">
                      <div className="quest-submission-info">
                        <h3 className="quest-submission-title">
                          ⚔️ {submission.questTitle} <span className="quest-xp-badge">+{submission.questXp} XP</span>
                        </h3>
                        {submission.questDesc && (
                          <p className="quest-submission-desc">{submission.questDesc}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-quest"
                        onClick={() => handleRemoveQuestSubmission(index)}
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
                            />
                            <label htmlFor={`quest-image-${index}`} className="btn-upload-image">
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
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                uploadingQuestIndex >= 0 
                  ? `Uploading quest ${uploadingQuestIndex + 1}/${selectedQuestSubmissions.length}...`
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
        confirmText={confirmModal.confirmText || 'OK'}
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default DailyUpdate;
