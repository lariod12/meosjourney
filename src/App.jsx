import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { CharacterProvider } from './contexts/CharacterContext';
import { characterData } from './data/characterData';
import CharacterSheet from './components/CharacterSheet';
import DailyUpdate from './components/notes/DailyUpdate';
import './assets/styles/global.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <CharacterProvider data={characterData}>
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
