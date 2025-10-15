import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CharacterProvider } from './contexts/CharacterContext';
import { characterData } from './data/characterData';
import { fetchCharacterViewData, CHARACTER_ID } from './services/firestore';
import CharacterSheet from './components/CharacterSheet';
import DailyUpdate from './components/notes/DailyUpdate';
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
        <CharacterSheet onNavigateToNotes={() => navigate('/notes/meos05')} />
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
        <Route path="/notes/meos05" element={<DailyUpdate onBack={() => window.history.back()} />} />
      </Routes>
    </Router>
  );
};

export default App;
