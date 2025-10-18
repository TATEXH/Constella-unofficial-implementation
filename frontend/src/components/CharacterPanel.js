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
  const [showAttributeHelp, setShowAttributeHelp] = useState({}); // 属性ヘルプの表示状態

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

  // 属性の詳細情報（説明・例・プレースホルダー）
  const getAttributeInfo = (type) => {
    const attributeInfo = {
      description: {
        title: '説明・外見',
        description: 'キャラクターの基本的な紹介や外見的特徴を記述します。',
        examples: [
          '元気いっぱいの17歳の高校生。黒髪のショートカットで、いつも明るい笑顔を浮かべている。',
          '25歳の図書館司書。肩まで伸びた栗色の髪を後ろで束ね、丸縁の眼鏡をかけている。穏やかな表情だが、好きな本の話になると目が輝く。'
        ],
        placeholder: '例: 17歳の高校生。黒髪のショートカットで、いつも明るい笑顔を浮かべている。'
      },
      personality: {
        title: '性格・内面',
        description: 'キャラクターの性格、思考パターン、価値観を記述します。',
        examples: [
          '好奇心旺盛で行動力がある。時々おっちょこちょいだが、困っている人を見ると放っておけない性格。',
          '内向的で慎重な性格。新しい環境に馴染むのに時間がかかるが、一度打ち解けると深い信頼関係を築く。完璧主義的な一面があり、責任感が強い。'
        ],
        placeholder: '例: 好奇心旺盛で行動力がある。困っている人を見ると放っておけない性格。'
      },
      currentStatus: {
        title: '現在の状況・状態',
        description: '現時点でのキャラクターの置かれた状況や抱えている問題を記述します。',
        examples: [
          '大学受験を控えており、将来の進路について悩んでいる。部活動と勉強の両立に苦労中。',
          '転職活動中で新しい職場を探している。前職での人間関係のストレスから一時的に実家に戻って心を休めている状態。新しいスタートを切りたい気持ちと不安な気持ちが入り混じっている。'
        ],
        placeholder: '例: 大学受験を控えており、将来の進路について悩んでいる。'
      },
      backstory: {
        title: '背景・過去',
        description: 'キャラクターの生い立ちや重要な過去の出来事を記述します。',
        examples: [
          '幼少期に両親を亡くし、祖母に育てられた。祖母の影響で料理が得意になり、人を喜ばせることに生きがいを感じる。',
          '東京で生まれ育ったが、10歳の時に父親の仕事の都合で地方の小さな町に引っ越した。最初は都会との違いに戸惑ったが、地域の図書館で出会った年配の司書に影響を受け、本の世界に深く魅力を感じるようになった。'
        ],
        placeholder: '例: 幼少期に両親を亡くし、祖母に育てられた。祖母の影響で料理が得意になった。'
      }
    };
    return attributeInfo[type] || { title: type, description: '', examples: [], placeholder: '' };
  };

  // 属性ヘルプの表示切り替え
  const toggleAttributeHelp = (type) => {
    setShowAttributeHelp(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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
              {/* 説明 */}
              <div style={{ display: 'inline-block', marginRight: '10px', marginBottom: '5px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddAttribute('description')}
                  style={{ marginRight: '5px' }}
                >
                  + 説明
                </button>
                <button
                  onClick={() => toggleAttributeHelp('description')}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    color: '#007bff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="説明・使い方を表示"
                >
                  ?
                </button>
              </div>

              {/* 性格 */}
              <div style={{ display: 'inline-block', marginRight: '10px', marginBottom: '5px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddAttribute('personality')}
                  style={{ marginRight: '5px' }}
                >
                  + 性格
                </button>
                <button
                  onClick={() => toggleAttributeHelp('personality')}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    color: '#007bff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="性格・使い方を表示"
                >
                  ?
                </button>
              </div>

              {/* 現在の状況 */}
              <div style={{ display: 'inline-block', marginRight: '10px', marginBottom: '5px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddAttribute('currentStatus')}
                  style={{ marginRight: '5px' }}
                >
                  + 現在の状況
                </button>
                <button
                  onClick={() => toggleAttributeHelp('currentStatus')}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    color: '#007bff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="現在の状況・使い方を表示"
                >
                  ?
                </button>
              </div>

              {/* 背景設定 */}
              <div style={{ display: 'inline-block', marginBottom: '5px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddAttribute('backstory')}
                  style={{ marginRight: '5px' }}
                >
                  + 背景設定
                </button>
                <button
                  onClick={() => toggleAttributeHelp('backstory')}
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                    color: '#007bff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="背景設定・使い方を表示"
                >
                  ?
                </button>
              </div>
            </div>

            {/* ヘルプ表示エリア */}
            {Object.keys(showAttributeHelp).map(type =>
              showAttributeHelp[type] && (
                <div
                  key={type}
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    padding: '15px',
                    marginBottom: '15px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h5 style={{ margin: 0, color: '#495057' }}>
                      📝 {getAttributeInfo(type).title}
                    </h5>
                    <button
                      onClick={() => toggleAttributeHelp(type)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <p style={{ color: '#6c757d', marginBottom: '12px', fontSize: '14px' }}>
                    {getAttributeInfo(type).description}
                  </p>

                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#495057', fontSize: '13px' }}>記入例:</strong>
                    {getAttributeInfo(type).examples.map((example, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#fff',
                          border: '1px solid #e9ecef',
                          borderRadius: '4px',
                          padding: '8px 10px',
                          marginTop: '6px',
                          fontSize: '13px',
                          color: '#495057',
                          lineHeight: '1.4'
                        }}
                      >
                        {example}
                      </div>
                    ))}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleAddAttribute(type);
                        toggleAttributeHelp(type);
                      }}
                      style={{ fontSize: '13px', padding: '6px 12px' }}
                    >
                      + {getAttributeLabel(type)}を追加
                    </button>
                  </div>
                </div>
              )
            )}

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
                  placeholder={getAttributeInfo(attr.type).placeholder}
                  style={{
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
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
              {formData.relationships.map((rel, index) => {
                const targetCharacter = allCharacters.find(
                  c => (c.id || c._id) === rel.target_character_id
                );
                const targetName = targetCharacter ? targetCharacter.name : '不明なキャラクター';

                return (
                  <div key={index} className="relationship-item-card">
                    <div className="relationship-info">
                      <div className="relationship-target">
                        {targetName}
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
                );
              })}
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