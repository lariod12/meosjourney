import { useState, useEffect, useRef } from 'react';
import './DailyUpdatePage.css';
import { fetchConfig, saveStatus, saveJournal, CHARACTER_ID } from '../../services/firestore';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    // Load config from Firestore
    fetchConfig(CHARACTER_ID)
      .then(cfg => {
        setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []);
        setCorrectPassword(cfg?.pwDailyUpdate || null);
      })
      .catch(() => {
        setMoodOptions([]);
        setCorrectPassword(null);
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

      // Show success message
      if (results.length > 0) {
        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: `${results.join(' & ')} saved successfully!`,
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

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
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
