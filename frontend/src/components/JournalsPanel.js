import React, { useState, useEffect } from 'react';
import api from '../services/api';

const JournalsPanel = ({ journals, characters, onClose, onUpdate }) => {
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [theme, setTheme] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [journalComments, setJournalComments] = useState({});

  useEffect(() => {
    // 各ジャーナルのコメントを読み込み
    journals.forEach(journal => {
      loadComments(journal.id || journal._id);
    });
  }, [journals]);

  const loadComments = async (journalId) => {
    try {
      const comments = await api.getJournalComments(journalId);
      setJournalComments(prev => ({
        ...prev,
        [journalId]: comments
      }));
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
    }
  };

  const handleGenerateJournals = async () => {
    if (selectedCharacters.length === 0 || !theme) {
      alert('キャラクターとテーマを入力してください');
      return;
    }

    try {
      await api.generateJournals(selectedCharacters, theme);
      onUpdate();
      setShowNewForm(false);
      setSelectedCharacters([]);
      setTheme('');
    } catch (error) {
      console.error('ジャーナル生成エラー:', error);
    }
  };

  const handleCharacterSelect = (characterId) => {
    if (selectedCharacters.includes(characterId)) {
      setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
    } else {
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  };

  const handleGenerateComment = async (journalId, characterId) => {
    try {
      await api.generateComment(journalId, characterId);
      loadComments(journalId);
    } catch (error) {
      console.error('コメント生成エラー:', error);
    }
  };

  const getCharacterName = (characterId) => {
    const character = characters.find(c => (c.id || c._id) === characterId);
    return character ? character.name : '不明';
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Journals</h2>
        <div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowNewForm(!showNewForm)}
            style={{ marginRight: '10px' }}
          >
            + New Journal
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>

      {showNewForm && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>新しいジャーナルを生成</h3>
          
          <div className="form-group">
            <label className="form-label">キャラクターを選択</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {characters.map(character => (
                <label 
                  key={character.id || character._id}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(character.id || character._id)}
                    onChange={() => handleCharacterSelect(character.id || character._id)}
                    style={{ marginRight: '5px' }}
                  />
                  {character.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">テーマ</label>
            <textarea
              className="form-textarea"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例：地球で初めて甘いキャンディーを味わった"
            />
          </div>

          <button 
            className="btn btn-success"
            onClick={handleGenerateJournals}
          >
            ジャーナルを生成
          </button>
        </div>
      )}

      <div className="journals-list">
        {journals.map(journal => (
          <div key={journal.id || journal._id} className="journal-entry">
            <div className="journal-header">
              <span className="journal-character">
                {getCharacterName(journal.character_id)}
              </span>
              <span className="journal-date">
                {new Date(journal.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
            
            <div className="journal-content">
              {journal.content}
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4>コメント</h4>
              
              <div style={{ marginTop: '10px' }}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      handleGenerateComment(journal.id || journal._id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  style={{ marginRight: '10px' }}
                >
                  <option value="">コメントするキャラクターを選択</option>
                  {characters
                    .filter(c => (c.id || c._id) !== journal.character_id)
                    .map(character => (
                      <option 
                        key={character.id || character._id} 
                        value={character.id || character._id}
                      >
                        {character.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="comments-list" style={{ marginTop: '15px' }}>
                {journalComments[journal.id || journal._id]?.map(comment => (
                  <div 
                    key={comment.id || comment._id}
                    style={{ 
                      background: '#fff',
                      padding: '10px',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <strong>{getCharacterName(comment.character_id)}:</strong>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalsPanel;