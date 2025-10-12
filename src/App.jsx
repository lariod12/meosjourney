import { CharacterProvider } from './contexts/CharacterContext';
import { characterData } from './data/characterData';
import CharacterSheet from './components/CharacterSheet';
import './assets/styles/global.css';

const App = () => {
  return (
    <CharacterProvider data={characterData}>
      <div className="bg-pattern"></div>
      <div className="container">
        <CharacterSheet />
      </div>
    </CharacterProvider>
  );
};

export default App;
