import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts';
import { characterData } from './data/characterData';
import { useCharacterData } from './hooks/useCharacterData';
import CharacterSheet from './pages/HomePage';
import DailyUpdatePage from './pages/DailyUpdatePage';
import AdminAchievementsPage from './pages/AdminAchievementsPage';
import './styles/global.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { data, loading } = useCharacterData(characterData);

  // Show loading state briefly (optional)
  if (loading && !data.name) {
    return (
      <div className="bg-pattern">
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          fontFamily: 'Kalam, cursive',
          fontSize: '18px'
        }}>
          Loading...
        </div>
      </div>
    );
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
  const basename = import.meta.env.MODE === 'production' ? '/meosjourney' : '/';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user/meos05" element={<DailyUpdatePage onBack={() => window.history.back()} />} />
        <Route path="/admin/meos05" element={<AdminAchievementsPage onBack={() => window.history.back()} />} />
      </Routes>
    </Router>
  );
};

export default App;
