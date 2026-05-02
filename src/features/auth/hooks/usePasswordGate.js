import { useEffect, useState } from 'react';

export const usePasswordGate = ({
  correctPassword,
  sessionKey,
  onBack,
  setConfirmModal,
  rememberPersistent = false,
  hidePromptOnFailure = false
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (correctPassword === null) return;

    const sessionGranted = sessionStorage.getItem(sessionKey) === 'granted';
    const rememberedGranted = rememberPersistent && localStorage.getItem(sessionKey) === 'granted';

    if (sessionGranted || rememberedGranted) {
      setIsAuthenticated(true);
      return;
    }

    setShowPasswordModal(true);
  }, [correctPassword, rememberPersistent, sessionKey]);

  const handlePasswordSubmit = (password, rememberMe = false) => {
    if (password === correctPassword) {
      sessionStorage.setItem(sessionKey, 'granted');

      if (rememberPersistent) {
        if (rememberMe) {
          localStorage.setItem(sessionKey, 'granted');
        } else {
          localStorage.removeItem(sessionKey);
        }
      }

      setIsAuthenticated(true);
      setShowPasswordModal(false);
      return;
    }

    if (hidePromptOnFailure) {
      setShowPasswordModal(false);
    }

    setConfirmModal({
      isOpen: true,
      type: 'error',
      title: 'Access Denied',
      message: 'Incorrect password. Please try again.',
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setShowPasswordModal(false);
        if (onBack) onBack();
      },
      onCancel: null
    });
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    if (onBack) onBack();
  };

  return {
    isAuthenticated,
    showPasswordModal,
    handlePasswordSubmit,
    handlePasswordCancel
  };
};
