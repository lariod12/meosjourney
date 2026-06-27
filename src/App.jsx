import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts';
import { characterData } from './data/characterData';
import { useCharacterData } from './hooks/useCharacterData';
import { LoadingDialog } from './components/common';
import PasswordModal from './components/PasswordModal/PasswordModal';
import ConfirmModal from './components/ConfirmModal/ConfirmModal';
import { usePasswordGate } from './features/auth/hooks/usePasswordGate';
import { fetchPetPagePasswordConfig } from './services/nocodb';
import CharacterSheet from './pages/HomePage';
import './styles/global.css';

const UserPage = lazy(() => import('./pages/UserPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PetPage = lazy(() => import('./pages/PetPage'));
const PET_SESSION_KEY = 'pet_meos05_access';

const withPageLoader = (element) => (
  <Suspense fallback={<LoadingDialog />}>
    {element}
  </Suspense>
);

const PetPageWrapper = () => {
  const navigate = useNavigate();
  const [correctPassword, setCorrectPassword] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
    canClose: false
  });

  useEffect(() => {
    const loadConfig = async () => {
      const startedAt = Date.now();

      try {
        const cfg = await fetchPetPagePasswordConfig();
        if (import.meta.env.MODE !== 'production') {
          console.log(`⏱️ Pet password config loaded in ${Date.now() - startedAt}ms`);
        }

        if (cfg?.pwDailyUpdate) {
          setCorrectPassword(cfg.pwDailyUpdate);
          return;
        }

        console.warn('Pet page password is not configured');
        navigate('/');
      } catch (error) {
        console.error('Error loading pet page password config:', error);
        navigate('/');
      }
    };

    loadConfig();
  }, [navigate]);

  const {
    isAuthenticated,
    showPasswordModal,
    handlePasswordSubmit,
    handlePasswordCancel
  } = usePasswordGate({
    correctPassword,
    sessionKey: PET_SESSION_KEY,
    onBack: () => navigate('/'),
    setConfirmModal,
    rememberPersistent: true,
    hidePromptOnFailure: true
  });

  const authConfirmModal = confirmModal.isOpen ? (
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      type={confirmModal.type}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText={confirmModal.confirmText}
      cancelText={confirmModal.cancelText}
      onConfirm={confirmModal.onConfirm}
      onCancel={confirmModal.onCancel}
      canClose={confirmModal.canClose ?? false}
    />
  ) : null;

  if (showPasswordModal) {
    return (
      <>
        <PasswordModal
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
          enableRemember
        />
        {authConfirmModal}
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoadingDialog />
        {authConfirmModal}
      </>
    );
  }

  return <PetPage onBack={() => navigate('/')} />;
};

const UserPageWrapper = () => {
  const navigate = useNavigate();
  return <UserPage onBack={() => navigate('/')} />;
};

const AdminPageWrapper = () => {
  const navigate = useNavigate();
  return <AdminPage onBack={() => navigate('/')} />;
};

const HomePage = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useCharacterData(characterData);

  // Listen for refresh events from UserPage
  useEffect(() => {
    const handleRefresh = () => {
      if (import.meta.env.MODE !== 'production') {
        console.log('🔄 Refresh event received from UserPage');
      }

      refetch(true);
    };

    window.addEventListener('meo:refresh', handleRefresh);
    return () => window.removeEventListener('meo:refresh', handleRefresh);
  }, [refetch]);

  return loading ? (
    <LoadingDialog/>
  ) : (
    <CharacterProvider data={data}>
      <div className="bg-pattern"></div>
      <div className="container">
        <CharacterSheet onNavigateToNotes={() => navigate('/user/meos05')} />
      </div>
    </CharacterProvider>
  );
};

const App = () => {
  const basename = window.location.hostname.endsWith('github.io')
    && window.location.pathname.startsWith('/meosjourney')
    ? '/meosjourney'
    : '';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pet" element={withPageLoader(<PetPageWrapper />)} />
        <Route path="/user/meos05" element={withPageLoader(<UserPageWrapper />)} />
        <Route path="/admin/meos05" element={withPageLoader(<AdminPageWrapper />)} />
      </Routes>
    </Router>
  );
};

export default App;
