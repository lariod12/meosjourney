import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts';
import { characterData } from './data/characterData';
import { useCharacterData } from './hooks/useCharacterData';
import { LoadingDialog } from './components/common';
import { canRefresh, getRemainingCooldown } from './utils/cacheManager';
import CharacterSheet from './pages/HomePage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import './styles/global.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useCharacterData(characterData);
  const [showCooldownNotice, setShowCooldownNotice] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Listen for refresh events from UserPage
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Refresh event received from UserPage');
      
      // Check if refresh is allowed
      if (canRefresh()) {
        refetch(true); // Force refresh
      } else {
        const remaining = getRemainingCooldown();
        console.log(`⏱️ Refresh cooldown active: ${remaining}s remaining`);
        setCooldownSeconds(remaining);
        setShowCooldownNotice(true);
        
        // Auto-hide notice after 3 seconds
        setTimeout(() => setShowCooldownNotice(false), 3000);
      }
    };

    window.addEventListener('meo:refresh', handleRefresh);
    return () => window.removeEventListener('meo:refresh', handleRefresh);
  }, [refetch]);

  // Show loading dialog while fetching data (includes avatar)
  if (loading) {
    return <LoadingDialog />;
  }

  return (
    <CharacterProvider data={data}>
      <div className="bg-pattern"></div>
      <div className="container">
        <CharacterSheet onNavigateToNotes={() => navigate('/user/meos05')} />
        
        {/* Cooldown Notice */}
        {showCooldownNotice && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#000',
            color: '#fff',
            padding: '12px 24px',
            border: '2px solid #fff',
            borderRadius: '4px',
            zIndex: 9999,
            fontFamily: 'Patrick Hand, cursive',
            fontSize: '16px',
            boxShadow: '4px 4px 0 rgba(255,255,255,0.3)'
          }}>
            ⏱️ Please wait {cooldownSeconds}s before refreshing again
          </div>
        )}
      </div>
    </CharacterProvider>
  );
};

const App = () => {
  // Use Vite's BASE_URL to keep router base in sync with build base (handles GH Pages subpath)
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user/meos05" element={<UserPage onBack={() => window.history.back()} />} />
        <Route path="/admin/meos05" element={<AdminPage onBack={() => window.history.back()} />} />
      </Routes>
    </Router>
  );
};

export default App;
