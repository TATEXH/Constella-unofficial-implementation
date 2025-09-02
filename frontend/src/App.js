import React, { useState, useEffect } from 'react';
import './App.css';
import MainCanvas from './components/MainCanvas';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import CharacterPanel from './components/CharacterPanel';
import JournalsPanel from './components/JournalsPanel';
import api from './services/api';

function App() {
  const [characters, setCharacters] = useState([]);
  const [journals, setJournals] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // 初期データを読み込み
  useEffect(() => {
    loadCharacters();
    loadJournals();
  }, []);

  const loadCharacters = async () => {
    try {
      const data = await api.getCharacters();
      setCharacters(data);
    } catch (error) {
      console.error('キャラクター読み込みエラー:', error);
    }
  };

  const loadJournals = async () => {
    try {
      const data = await api.getJournals();
      setJournals(data);
    } catch (error) {
      console.error('ジャーナル読み込みエラー:', error);
    }
  };

  const handleOpenCharacterPanel = (character = null) => {
    setSelectedCharacter(character);
    setActivePanel('character');
  };

  const handleOpenJournalsPanel = () => {
    setActivePanel('journals');
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setSelectedCharacter(null);
  };

  return (
    <div className="app">
      <LeftSidebar onOpenJournals={handleOpenJournalsPanel} />
      
      <MainCanvas>
        {activePanel === 'character' && (
          <CharacterPanel 
            character={selectedCharacter}
            onClose={handleClosePanel}
            onSave={loadCharacters}
          />
        )}
        {activePanel === 'journals' && (
          <JournalsPanel 
            journals={journals}
            characters={characters}
            onClose={handleClosePanel}
            onUpdate={loadJournals}
          />
        )}
      </MainCanvas>
      
      <RightSidebar 
        characters={characters}
        onSelectCharacter={handleOpenCharacterPanel}
        onCreateNew={() => handleOpenCharacterPanel(null)}
      />
    </div>
  );
}

export default App;