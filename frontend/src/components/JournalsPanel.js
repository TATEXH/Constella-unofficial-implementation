import React, { useState, useEffect } from 'react';
import api from '../services/api';

const JournalsPanel = ({ journals, characters, onClose, onUpdate }) => {
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [theme, setTheme] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [journalComments, setJournalComments] = useState({});
  const [editingJournal, setEditingJournal] = useState(null);
  const [editContent, setEditContent] = useState('');

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

  const handleDeleteJournal = async (journalId) => {
    if (window.confirm('このジャーナルを削除しますか？この操作は取り消せません。')) {
      try {
        await api.deleteJournal(journalId);
        onUpdate();
      } catch (error) {
        console.error('ジャーナル削除エラー:', error);
        alert('ジャーナルの削除に失敗しました。');
      }
    }
  };

  const handleDeleteComment = async (commentId, journalId) => {
    if (window.confirm('このコメントを削除しますか？')) {
      try {
        await api.deleteComment(commentId);
        loadComments(journalId);
      } catch (error) {
        console.error('コメント削除エラー:', error);
        alert('コメントの削除に失敗しました。');
      }
    }
  };

  const handleStartEdit = (journal) => {
    setEditingJournal(journal.id || journal._id);
    setEditContent(journal.content);
  };

  const handleCancelEdit = () => {
    setEditingJournal(null);
    setEditContent('');
  };

  const handleSaveEdit = async (journalId) => {
    try {
      await api.updateJournal(journalId, { content: editContent });
      onUpdate();
      setEditingJournal(null);
      setEditContent('');
    } catch (error) {
      console.error('ジャーナル更新エラー:', error);
      alert('ジャーナルの更新に失敗しました。');
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
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                {editingJournal !== (journal.id || journal._id) && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStartEdit(journal)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    編集
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteJournal(journal.id || journal._id)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px'
                  }}
                >
                  削除
                </button>
              </div>
            </div>

            <div className="journal-content">
              {editingJournal === (journal.id || journal._id) ? (
                <div>
                  <textarea
                    className="form-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ width: '100%', minHeight: '200px' }}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleSaveEdit(journal.id || journal._id)}
                    >
                      保存
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{journal.content}</div>
              )}
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
                      marginBottom: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{getCharacterName(comment.character_id)}:</strong>
                        <p>{comment.content}</p>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteComment(comment.id || comment._id, journal.id || journal._id)}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          marginLeft: '10px'
                        }}
                      >
                        削除
                      </button>
                    </div>
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