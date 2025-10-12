import { createContext, useContext } from 'react';

const CharacterContext = createContext(null);

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within CharacterProvider');
  }
  return context;
};

export const CharacterProvider = ({ children, data }) => {
  return (
    <CharacterContext.Provider value={data}>
      {children}
    </CharacterContext.Provider>
  );
};

export default CharacterContext;
