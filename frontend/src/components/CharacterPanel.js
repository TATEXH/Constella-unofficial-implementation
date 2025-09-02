import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CharacterPanel = ({ character, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [formData, setFormData] = useState({
    name: '',
    attributes: [],
    relationships: []
  });
  const [relationshipPhrase, setRelationshipPhrase] = useState('');

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        attributes: character.attributes || [],
        relationships: character.relationships || []
      });
    }
  }, [character]);

  const handleSave = async () => {
    try {
      if (character) {
        // 更新
        await api.updateCharacter(character.id || character._id, formData);
      } else {
        // 新規作成
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        await api.createCharacter(formDataObj);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
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
    
    try {
      const result = await api.generateFriends(
        character.id || character._id, 
        relationshipPhrase
      );
      console.log('生成されたキャラクター:', result);
      // TODO: 生成されたキャラクターを表示
    } catch (error) {
      console.error('Friends Discovery エラー:', error);
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

          <button className="btn btn-success" onClick={handleSave}>
            保存
          </button>
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
              style={{ marginTop: '10px' }}
            >
              新しいキャラクターを生成
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">関係性</label>
            {formData.relationships.map((rel, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <p>{rel.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <p>履歴機能は開発中です</p>
        </div>
      )}
    </div>
  );
};

export default CharacterPanel;