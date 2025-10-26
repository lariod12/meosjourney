import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CharacterProvider } from './contexts';
import { characterData } from './data/characterData';
import { fetchCharacterViewData, CHARACTER_ID } from './services';
import CharacterSheet from './pages/HomePage';
import DailyUpdatePage from './pages/DailyUpdatePage';
import AdminAchievementsPage from './pages/AdminAchievementsPage';
import './assets/styles/global.css';

const HomePage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(characterData);

  useEffect(() => {
    let mounted = true;
    fetchCharacterViewData(CHARACTER_ID, characterData)
      .then((merged) => { if (mounted) setData(merged); })
      .catch(() => { /* keep defaults on error */ });
    return () => { mounted = false; };
  }, []);

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
