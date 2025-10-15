import { useState, useEffect, useRef } from 'react';
import './DailyUpdate.css';
import { fetchConfig, CHARACTER_ID } from '../../services/firestore';

const CORRECT_PASSWORD = '0929';
const SESSION_KEY = 'meos05_access';

const DailyUpdate = ({ onBack }) => {
  const [moodOptions, setMoodOptions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    noteDate: new Date().toISOString().split('T')[0],
    currentActivity: '',
    location: '',
    mood: '',
    journalEntry: ''
  });

  const moodRef = useRef(null);
  const [moodOpen, setMoodOpen] = useState(false);

  useEffect(() => {
    // Load config for mood options from Firestore
    fetchConfig(CHARACTER_ID)
      .then(cfg => setMoodOptions(Array.isArray(cfg?.moodOptions) ? cfg.moodOptions : []))
      .catch(() => setMoodOptions([]));

    // Check if already authenticated
    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
      setIsAuthenticated(true);
      return;
    }

    // Prompt for password
    const userPassword = prompt('🔒 Enter password to access:');
    
    if (userPassword === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'granted');
      setIsAuthenticated(true);
    } else if (userPassword !== null) {
      alert('❌ Incorrect password. Access denied.');
      if (onBack) onBack();
    } else {
      if (onBack) onBack();
    }
  }, [onBack]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== FORM DATA (Test Only) ===');
    console.log(formData);
    console.log('=============================');
    
    alert('✓ UI Test Mode\n\nForm data logged to console.\nLogic chưa được implement.');
  };

  const handleReset = () => {
    setFormData({
      noteDate: new Date().toISOString().split('T')[0],
      currentActivity: '',
      location: '',
      mood: '',
      journalEntry: ''
    });
  };

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
            <h2>▸ Status Update</h2>
            
            <div className="form-group">
              <label htmlFor="currentActivity">Current Activity</label>
              <input 
                type="text" 
                id="currentActivity" 
                name="currentActivity" 
                value={formData.currentActivity}
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

          {/* Daily Journal */}
          <div className="form-section">
            <h2>▸ Daily Journal</h2>
            
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

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn-primary">Submit</button>
            <button type="button" onClick={handleReset} className="btn-secondary">✕ Reset</button>
          </div>
        </form>
      </main>

      <footer className="notes-footer">
        <p>◆ Keep tracking your journey</p>
      </footer>
    </div>
  );
};

export default DailyUpdate;
