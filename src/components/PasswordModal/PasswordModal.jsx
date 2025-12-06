import { useState } from 'react';
import './PasswordModal.css';

const PasswordModal = ({ onSubmit, onCancel, enableRemember = false }) => {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password, rememberMe);
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <h2>Enter Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="password-input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              autoComplete="off"
            />
          </div>
          {enableRemember && (
            <div className="password-remember">
              <input
                id="password-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="password-remember">Remember me</label>
            </div>
          )}
          <div className="password-modal-actions">
            <button type="submit" className="btn-submit">
              OK
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
