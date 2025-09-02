import React from 'react';

const RightSidebar = ({ characters, onSelectCharacter, onCreateNew }) => {
  return (
    <div className="sidebar sidebar-right">
      <h3 style={{ marginBottom: '20px' }}>キャラクター</h3>
      
      <button 
        className="btn btn-primary" 
        onClick={onCreateNew}
        style={{ width: '100%', marginBottom: '20px' }}
      >
        + 新規作成
      </button>
      
      <div className="characters-list">
        {characters.map(character => (
          <div 
            key={character.id || character._id}
            className="character-card"
            onClick={() => onSelectCharacter(character)}
          >
            {character.image_path && (
              <img 
                src={character.image_path} 
                alt={character.name}
                className="character-image"
              />
            )}
            <div className="character-name">{character.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightSidebar;