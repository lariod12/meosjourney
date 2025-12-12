import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts';
import { characterData } from './data/characterData';
import { useCharacterData } from './hooks/useCharacterData';
import { LoadingDialog } from './components/common';
import CharacterSheet from './pages/HomePage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import './styles/global.css';

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

  // Show loading dialog while fetching data (includes avatar)
  if (loading) {
    return <LoadingDialog />;
  }

  return (
    <CharacterProvider data={data}>
      <div className="bg-pattern"></div>
      <div className="container">
        <CharacterSheet onNavigateToNotes={() => navigate('/user/meos05')} />
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
