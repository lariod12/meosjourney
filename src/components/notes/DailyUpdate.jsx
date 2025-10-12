import { useState, useEffect } from 'react';
import './DailyUpdate.css';

const CORRECT_PASSWORD = 'meos05';
const SESSION_KEY = 'meos05_access';

const DailyUpdate = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    noteDate: new Date().toISOString().split('T')[0],
    currentActivity: '',
    location: '',
    mood: '',
    journalEntry: ''
  });

  useEffect(() => {
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

  return (
    <div className="notes-container">
      <header className="notes-header">
        <button onClick={onBack} className="back-link">◄ Back</button>
        <h1>✎ Daily Update</h1>
        <div className="subtitle">Cập nhật hàng ngày</div>
      </header>

      <main className="update-form">
        <form id="dailyUpdateForm" onSubmit={handleSubmit}>
          
          {/* Date */}
          <div className="form-section">
            <h2>▸ Ngày</h2>
            <div className="form-group">
              <input 
                type="date" 
                id="noteDate" 
                name="noteDate" 
                value={formData.noteDate}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

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
              <input 
                type="text" 
                id="mood" 
                name="mood" 
                value={formData.mood}
                onChange={handleChange}
                placeholder="e.g., Focused, Relaxed, Energetic" 
              />
            </div>
          </div>

          {/* Daily Journal */}
          <div className="form-section">
            <h2>▸ Daily Journal</h2>
            
            <div className="form-group">
              <label htmlFor="journalEntry">Nhật ký hôm nay</label>
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
            <button type="submit" className="btn-primary">◆ Lưu Update</button>
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
