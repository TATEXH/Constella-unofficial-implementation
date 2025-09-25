import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FriendsDiscoveryModal from './FriendsDiscoveryModal';

const CharacterPanel = ({ character, onClose, onSave, allCharacters = [] }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [formData, setFormData] = useState({
    name: '',
    attributes: [],
    relationships: []
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [relationshipPhrase, setRelationshipPhrase] = useState('');
  const [generatedCharacters, setGeneratedCharacters] = useState([]);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    targetCharacterId: '',
    description: ''
  });
  const [characterHistory, setCharacterHistory] = useState({
    journals: [],
    comments: []
  });
  const [isGeneratingFriends, setIsGeneratingFriends] = useState(false);

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        attributes: character.attributes || [],
        relationships: character.relationships || []
      });
      if (character.image_path) {
        setPreviewUrl(`http://localhost:8000${character.image_path}`);
      } else {
        setPreviewUrl(null);
      }
      // 履歴データを読み込む
      loadCharacterHistory(character.id || character._id);
    } else {
      // 新規作成の場合は全てリセット
      setFormData({
        name: '',
        attributes: [],
        relationships: []
      });
      setSelectedImage(null);
      setPreviewUrl(null);
      setRelationshipPhrase('');
      setGeneratedCharacters([]);
      setNewRelationship({
        targetCharacterId: '',
        description: ''
      });
      setCharacterHistory({
        journals: [],
        comments: []
      });
      setActiveTab('about'); // Aboutタブに戻す
    }
  }, [character]);

  const loadCharacterHistory = async (characterId) => {
    try {
      const [journals, comments] = await Promise.all([
        api.getJournals(),
        api.getCharacterComments(characterId)
      ]);

      // このキャラクターのジャーナルをフィルタ
      const characterJournals = journals.filter(j => j.character_id === characterId);

      setCharacterHistory({
        journals: characterJournals,
        comments: comments
      });
    } catch (error) {
      console.error('履歴データの読み込みエラー:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ファイルサイズチェック（10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。');
        return;
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('サポートされていないファイル形式です。JPEG、PNG、GIF、WebPのみ使用可能です。');
        return;
      }

      setSelectedImage(file);
      
      // プレビュー用URL作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (character) {
        // 更新
        await api.updateCharacter(character.id || character._id, formData);

        // 画像が選択されている場合は画像も更新
        if (selectedImage) {
          const imageFormData = new FormData();
          imageFormData.append('image', selectedImage);
          await api.updateCharacterImage(character.id || character._id, imageFormData);
        }
      } else {
        // 新規作成
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        if (selectedImage) {
          formDataObj.append('image', selectedImage);
        }
        await api.createCharacter(formDataObj);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  };

  const handleAddAttribute = (type) => {
    const newAttribute = { type, content: '' };
    setFormData({
      ...formData,
      attributes: [...formData.attributes, newAttribute]
    });
  };

  const handleAttributeChange = (index, content) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index].content = content;
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleDeleteAttribute = (index) => {
    const newAttributes = formData.attributes.filter((_, i) => i !== index);
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleFriendsDiscovery = async () => {
    if (!character || !relationshipPhrase) return;

    setIsGeneratingFriends(true);
    try {
      const result = await api.generateFriends(
        character.id || character._id,
        relationshipPhrase
      );
      setGeneratedCharacters(result.characters || []);
      setShowDiscoveryModal(true);
    } catch (error) {
      console.error('Friends Discovery エラー:', error);
      alert('キャラクター生成に失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setIsGeneratingFriends(false);
    }
  };

  const handleSaveGeneratedCharacter = async (generatedChar) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('name', generatedChar.name);
      
      const newCharacter = await api.createCharacter(formDataObj);
      
      // 属性を追加
      const attributes = [
        { type: 'description', content: generatedChar.introduction },
        { type: 'backstory', content: generatedChar.backstory }
      ];
      
      await api.updateCharacter(newCharacter.id, { attributes });
      
      // 現在のキャラクターとの関係性を追加
      const currentRelationships = [...formData.relationships];
      currentRelationships.push({
        target_character_id: newCharacter.id,
        description: generatedChar.your_relationship
      });
      
      setFormData({
        ...formData,
        relationships: currentRelationships
      });
      
      // 新キャラクターにも逆の関係性を追加
      await api.updateCharacter(newCharacter.id, {
        relationships: [{
          target_character_id: character.id || character._id,
          description: generatedChar.my_relationship
        }]
      });
      
      onSave(); // リストを更新
      alert(`${generatedChar.name}をキャラクターとして保存しました！`);
    } catch (error) {
      console.error('キャラクター保存エラー:', error);
      alert('キャラクターの保存に失敗しました。');
    }
  };

  const handleDeleteGeneratedCharacter = (index) => {
    const newGenerated = generatedCharacters.filter((_, i) => i !== index);
    setGeneratedCharacters(newGenerated);
  };

  const handleAddRelationship = () => {
    if (!newRelationship.targetCharacterId || !newRelationship.description) {
      alert('キャラクターと関係性の説明を入力してください。');
      return;
    }
    
    const updatedRelationships = [...formData.relationships, {
      target_character_id: newRelationship.targetCharacterId,
      description: newRelationship.description
    }];
    
    setFormData({
      ...formData,
      relationships: updatedRelationships
    });
    
    setNewRelationship({ targetCharacterId: '', description: '' });
  };

  const handleDeleteRelationship = (index) => {
    const updatedRelationships = formData.relationships.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      relationships: updatedRelationships
    });
  };

  const handleDeleteCharacter = async () => {
    if (!character) return;

    const confirmMessage = `本当に「${character.name}」を削除しますか？\nこの操作は取り消せません。関連するジャーナルとコメントも削除されます。`;
    if (window.confirm(confirmMessage)) {
      try {
        await api.deleteCharacter(character.id || character._id);
        alert('キャラクターを削除しました。');
        onSave(); // リストを更新
        onClose(); // パネルを閉じる
      } catch (error) {
        console.error('キャラクター削除エラー:', error);
        alert('キャラクターの削除に失敗しました。');
      }
    }
  };

  const handleExportCharacter = async () => {
    if (!character) return;

    try {
      const response = await api.exportCharacter(character.id || character._id);

      // ファイルをダウンロード
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`${character.name}.jsonをダウンロードしました。`);
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました。');
    }
  };

  const getAttributeLabel = (type) => {
    const labels = {
      description: '説明',
      personality: '性格',
      currentStatus: '現在の状況',
      backstory: '背景設定'
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            {character ? `${character.name} のプロフィール` : '新しいキャラクター'}
          </h2>
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={`tab ${activeTab === 'connection' ? 'active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          Connection
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'about' && (
        <div>
          <div className="form-group">
            <label className="form-label">名前</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">画像</label>
            {previewUrl && (
              <div style={{ marginBottom: '10px' }}>
                <img 
                  src={previewUrl} 
                  alt="プレビュー" 
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="form-input"
            />
            <small style={{ color: '#7f8c8d', fontSize: '12px' }}>
              対応形式: JPEG, PNG, GIF, WebP（最大10MB）
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">属性</label>
            <div style={{ marginBottom: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleAddAttribute('description')}
                style={{ marginRight: '10px' }}
              >
                + 説明
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleAddAttribute('personality')}
                style={{ marginRight: '10px' }}
              >
                + 性格
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleAddAttribute('currentStatus')}
                style={{ marginRight: '10px' }}
              >
                + 現在の状況
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleAddAttribute('backstory')}
              >
                + 背景設定
              </button>
            </div>

            {formData.attributes.map((attr, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <strong>{getAttributeLabel(attr.type)}</strong>
                  <button 
                    onClick={() => handleDeleteAttribute(index)}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'none', 
                      border: 'none', 
                      color: '#e74c3c',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  value={attr.content}
                  onChange={(e) => handleAttributeChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={handleSave}>
              保存
            </button>
            {character && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleExportCharacter}
                >
                  エクスポート
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteCharacter}
                >
                  キャラクターを削除
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'connection' && character && (
        <div>
          <div className="form-group">
            <label className="form-label">Friends Discovery</label>
            <input
              type="text"
              className="form-input"
              placeholder="関係性のフレーズ（例：最大の敵）"
              value={relationshipPhrase}
              onChange={(e) => setRelationshipPhrase(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={handleFriendsDiscovery}
              disabled={isGeneratingFriends}
              style={{
                marginTop: '10px',
                opacity: isGeneratingFriends ? 0.7 : 1
              }}
            >
              {isGeneratingFriends ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    marginRight: '8px',
                    animation: 'spin 1s linear infinite'
                  }}>⏳</span>
                  キャラクター生成中...
                </>
              ) : (
                '新しいキャラクターを生成'
              )}
            </button>

            {/* Friends Discovery 生成状況の表示 */}
            {isGeneratingFriends && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#e3f2fd',
                border: '1px solid #bbdefb',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#1976d2'
              }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '6px' }}>
                  🤖
                </span>
                AIが新しいキャラクターを生成しています...しばらくお待ちください
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">関係性の管理</label>
            
            <div className="add-relationship-form">
              <h4>新しい関係性を追加</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">対象キャラクター</label>
                  <select
                    className="form-input"
                    value={newRelationship.targetCharacterId}
                    onChange={(e) => setNewRelationship({
                      ...newRelationship,
                      targetCharacterId: e.target.value
                    })}
                  >
                    <option value="">キャラクターを選択...</option>
                    {allCharacters
                      .filter(char => (char.id || char._id) !== (character?.id || character?._id))
                      .map(char => (
                        <option key={char.id || char._id} value={char.id || char._id}>
                          {char.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">関係性の説明</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="関係性を説明してください"
                    value={newRelationship.description}
                    onChange={(e) => setNewRelationship({
                      ...newRelationship,
                      description: e.target.value
                    })}
                  />
                </div>
                <button 
                  className="btn btn-success"
                  onClick={handleAddRelationship}
                >
                  追加
                </button>
              </div>
            </div>

            <div className="relationship-list">
              {formData.relationships.map((rel, index) => (
                <div key={index} className="relationship-item-card">
                  <div className="relationship-info">
                    <div className="relationship-target">
                      キャラクターID: {rel.target_character_id}
                    </div>
                    <div className="relationship-description">
                      {rel.description}
                    </div>
                  </div>
                  <div className="relationship-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleDeleteRelationship(index)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
              {formData.relationships.length === 0 && (
                <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                  まだ関係性が設定されていません
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && character && (
        <div className="history-panel">
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>ジャーナル履歴 ({characterHistory.journals.length}件)</h3>
            {characterHistory.journals.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {characterHistory.journals
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((journal, index) => {
                    const relatedComments = characterHistory.comments.filter(c =>
                      (c.journal_id === (journal.id || journal._id))
                    );

                    return (
                      <div
                        key={journal.id || journal._id}
                        style={{
                          background: '#f8f9fa',
                          padding: '15px',
                          borderRadius: '8px',
                          marginBottom: '10px',
                          border: '1px solid #e9ecef'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '10px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#495057' }}>📖 {journal.theme}</strong>
                            <div style={{
                              fontSize: '11px',
                              color: '#6c757d',
                              marginTop: '2px'
                            }}>
                              投稿日時: {new Date(journal.created_at).toLocaleString('ja-JP')}
                            </div>
                          </div>

                          {relatedComments.length > 0 && (
                            <div style={{
                              background: '#fff3cd',
                              color: '#856404',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              marginLeft: '10px'
                            }}>
                              💬 {relatedComments.length}件のコメント
                            </div>
                          )}
                        </div>

                        <div style={{
                          maxHeight: '120px',
                          overflow: 'hidden',
                          fontSize: '14px',
                          color: '#495057',
                          lineHeight: '1.4',
                          position: 'relative'
                        }}>
                          {journal.content}
                          {journal.content.length > 200 && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              background: 'linear-gradient(to right, transparent, #f8f9fa)',
                              padding: '0 5px',
                              fontSize: '12px',
                              color: '#6c757d',
                              fontStyle: 'italic'
                            }}>
                              ...続きを読む
                            </div>
                          )}
                        </div>

                        {relatedComments.length > 0 && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: '#fff',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            <div style={{ color: '#6c757d', marginBottom: '5px' }}>
                              最新コメント:
                            </div>
                            <div style={{ color: '#495057', fontStyle: 'italic' }}>
                              "{relatedComments[relatedComments.length - 1].content.substring(0, 80)}
                              {relatedComments[relatedComments.length - 1].content.length > 80 ? '...' : ''}"
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                ジャーナルエントリーがありません
              </p>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '15px' }}>コメント履歴 ({characterHistory.comments.length}件)</h3>
            {characterHistory.comments.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {characterHistory.comments.map((comment, index) => {
                  const relatedJournal = characterHistory.journals.find(j =>
                    (j.id || j._id) === comment.journal_id
                  );
                  const isReply = comment.parent_comment_id;

                  return (
                    <div
                      key={comment.id || comment._id}
                      style={{
                        background: isReply ? '#f8f9fa' : '#fff',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: `1px solid ${isReply ? '#6c757d' : '#e9ecef'}`,
                        marginLeft: isReply ? '15px' : '0'
                      }}
                    >
                      {/* コメント種別の表示 */}
                      <div style={{
                        fontSize: '11px',
                        color: '#6c757d',
                        marginBottom: '5px',
                        fontWeight: 'bold'
                      }}>
                        {isReply ? '↳ 返信コメント' : '💬 コメント'}
                        {relatedJournal && (
                          <span style={{ marginLeft: '10px', fontWeight: 'normal' }}>
                            ジャーナル: {relatedJournal.theme}
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: '14px',
                        color: '#495057',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }}>
                        {comment.content}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: '#adb5bd'
                      }}>
                        <span>
                          {isReply ? '返信日時' : '投稿日時'}: {new Date(comment.created_at).toLocaleString('ja-JP')}
                        </span>
                        {relatedJournal && (
                          <span style={{
                            background: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px'
                          }}>
                            {new Date(relatedJournal.created_at).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                コメントがありません
              </p>
            )}
          </div>
        </div>
      )}
      </div>

      <FriendsDiscoveryModal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        generatedCharacters={generatedCharacters}
        onSaveCharacter={handleSaveGeneratedCharacter}
        onDeleteCharacter={handleDeleteGeneratedCharacter}
      />
    </>
  );
};

export default CharacterPanel;