import React, { useState, useEffect, useRef } from 'react';

/**
 * キャラクター選択コンポーネント
 * 検索機能付きドロップダウンで複数キャラクターを選択可能
 * 選択済みキャラクターはタグとして表示され、削除可能
 */
const CharacterSelector = ({
  characters = [],
  selectedCharacters = [],
  onChange,
  placeholder = "キャラクターを検索して選択..."
}) => {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCharacters, setFilteredCharacters] = useState([]);
  const dropdownRef = useRef(null);

  // 検索テキストでキャラクターをフィルタリングしてソート
  useEffect(() => {
    let result;
    if (searchText.trim() === '') {
      result = characters;
    } else {
      result = characters.filter(char =>
        char.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    // アルファベット順にソート
    const sorted = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    setFilteredCharacters(sorted);
  }, [searchText, characters]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // キャラクターを選択
  const handleSelectCharacter = (characterId) => {
    if (!selectedCharacters.includes(characterId)) {
      onChange([...selectedCharacters, characterId]);
    }
    setSearchText('');
    setIsOpen(false);
  };

  // キャラクターを削除
  const handleRemoveCharacter = (characterId) => {
    onChange(selectedCharacters.filter(id => id !== characterId));
  };

  // キャラクター名を取得
  const getCharacterName = (characterId) => {
    const character = characters.find(c => (c.id || c._id) === characterId);
    return character ? character.name : '不明';
  };

  // 未選択のキャラクターのみ表示
  const availableCharacters = filteredCharacters.filter(
    char => !selectedCharacters.includes(char.id || char._id)
  );

  return (
    <div className="character-selector" ref={dropdownRef}>
      {/* 選択済みキャラクターのタグ表示 */}
      {selectedCharacters.length > 0 && (
        <div className="selected-characters-tags" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px'
        }}>
          {selectedCharacters.map(charId => (
            <div
              key={charId}
              className="character-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#3498db',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                gap: '6px'
              }}
            >
              <span>{getCharacterName(charId)}</span>
              <button
                onClick={() => handleRemoveCharacter(charId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  lineHeight: '1',
                  fontWeight: 'bold'
                }}
                title="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 検索ボックス */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />

        {/* ドロップダウンリスト */}
        {isOpen && availableCharacters.length > 0 && (
          <div
            className="character-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '4px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 1000
            }}
          >
            {availableCharacters.map(character => (
              <div
                key={character.id || character._id}
                className="character-dropdown-item"
                onClick={() => handleSelectCharacter(character.id || character._id)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                {character.name}
              </div>
            ))}
          </div>
        )}

        {/* 検索結果なし */}
        {isOpen && searchText && availableCharacters.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '4px',
              padding: '15px',
              textAlign: 'center',
              color: '#7f8c8d',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              zIndex: 1000
            }}
          >
            該当するキャラクターが見つかりません
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSelector;
