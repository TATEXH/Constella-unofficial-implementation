import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CharacterSelector from './CharacterSelector';

const JournalsPanel = ({ journals, characters, onClose, onUpdate }) => {
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [theme, setTheme] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [journalComments, setJournalComments] = useState({});
  const [editingJournal, setEditingJournal] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // 返信対象のコメントID

  // プロンプトプレビュー用の状態
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptPreview, setPromptPreview] = useState(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // ローディング状態管理
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [generatingComments, setGeneratingComments] = useState(new Set()); // 生成中のコメントID

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

  const handlePreviewPrompt = async () => {
    if (selectedCharacters.length === 0 || !theme) {
      alert('キャラクターとテーマを入力してください');
      return;
    }

    setLoadingPrompt(true);
    try {
      // 最初のキャラクターでプレビュー
      const result = await api.previewJournalPrompt(selectedCharacters[0], theme);
      setPromptPreview(result);
      setShowPromptModal(true);
    } catch (error) {
      console.error('プロンプトプレビューエラー:', error);
      alert('プロンプトのプレビューに失敗しました。');
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    if (promptPreview) {
      navigator.clipboard.writeText(promptPreview.prompt);
      alert('プロンプトをクリップボードにコピーしました');
    }
  };

  const handleGenerateJournals = async () => {
    if (selectedCharacters.length === 0 || !theme) {
      alert('キャラクターとテーマを入力してください');
      return;
    }

    setIsGeneratingJournal(true);
    try {
      await api.generateJournals(selectedCharacters, theme);
      onUpdate();
      setShowNewForm(false);
      setSelectedCharacters([]);
      setTheme('');
    } catch (error) {
      console.error('ジャーナル生成エラー:', error);
      alert('ジャーナル生成に失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setIsGeneratingJournal(false);
    }
  };


  const handleGenerateComment = async (journalId, characterId, parentCommentId = null) => {
    const commentKey = `${journalId}-${characterId}-${parentCommentId || 'root'}`;

    setGeneratingComments(prev => new Set(prev).add(commentKey));
    try {
      await api.generateComment(journalId, characterId, parentCommentId);
      loadComments(journalId);
      setReplyingTo(null); // 返信モードをリセット
    } catch (error) {
      console.error('コメント生成エラー:', error);
      alert('コメント生成に失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setGeneratingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentKey);
        return newSet;
      });
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

  // コメントをスレッド構造に整理
  const organizeComments = (comments) => {
    const rootComments = [];
    const commentMap = {};

    // まずすべてのコメントをマップに格納
    comments.forEach(comment => {
      commentMap[comment.id || comment._id] = {
        ...comment,
        replies: []
      };
    });

    // 親子関係を構築
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap[comment.parent_comment_id];
        if (parent) {
          parent.replies.push(commentMap[comment.id || comment._id]);
        }
      } else {
        rootComments.push(commentMap[comment.id || comment._id]);
      }
    });

    return rootComments;
  };

  // 再帰的にコメントをレンダリング
  const renderComment = (comment, journalId, depth) => {
    const commentId = comment.id || comment._id;
    const indentLevel = depth * 20; // 20pxずつインデント

    return (
      <div key={commentId} style={{ marginLeft: `${indentLevel}px` }}>
        <div
          style={{
            background: depth === 0 ? '#fff' : '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '10px',
            position: 'relative',
            borderLeft: depth > 0 ? '3px solid #dee2e6' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <strong>{getCharacterName(comment.character_id)}:</strong>
              <p style={{ margin: '5px 0' }}>{comment.content}</p>

              {/* 返信ボタン */}
              <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setReplyingTo(replyingTo === commentId ? null : commentId)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: replyingTo === commentId ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {replyingTo === commentId ? 'キャンセル' : '返信'}
                </button>
              </div>

              {/* 返信フォーム */}
              {replyingTo === commentId && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#e9ecef', borderRadius: '4px' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleGenerateComment(journalId, e.target.value, commentId);
                        e.target.value = '';
                      }
                    }}
                    style={{ width: '100%' }}
                    disabled={Array.from(generatingComments).some(key =>
                      key.startsWith(`${journalId}-`) && key.endsWith(`-${commentId}`))}
                  >
                    {Array.from(generatingComments).some(key =>
                      key.startsWith(`${journalId}-`) && key.endsWith(`-${commentId}`)) ? (
                      <option value="">🔄 返信生成中...</option>
                    ) : (
                      <>
                        <option value="">返信するキャラクターを選択</option>
                        {characters
                          .filter(c => (c.id || c._id) !== comment.character_id)
                          .map(character => (
                            <option
                              key={character.id || character._id}
                              value={character.id || character._id}
                            >
                              {character.name}
                            </option>
                          ))}
                      </>
                    )}
                  </select>

                  {/* 返信生成状況の表示 */}
                  {Array.from(generatingComments).some(key =>
                    key.startsWith(`${journalId}-`) && key.endsWith(`-${commentId}`)) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '4px 8px',
                      background: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '3px',
                      fontSize: '11px',
                      color: '#155724'
                    }}>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '4px' }}>
                        ⏳
                      </span>
                      返信を生成中...
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="btn btn-danger"
              onClick={() => handleDeleteComment(commentId, journalId)}
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

        {/* 返信を再帰的にレンダリング */}
        {comment.replies && comment.replies.map(reply =>
          renderComment(reply, journalId, depth + 1)
        )}
      </div>
    );
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
            <CharacterSelector
              characters={characters}
              selectedCharacters={selectedCharacters}
              onChange={setSelectedCharacters}
              placeholder="キャラクターを検索して選択..."
            />
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline-secondary"
              onClick={handlePreviewPrompt}
              disabled={loadingPrompt || isGeneratingJournal}
              style={{
                opacity: loadingPrompt ? 0.7 : 1
              }}
            >
              {loadingPrompt ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    marginRight: '8px',
                    animation: 'spin 1s linear infinite'
                  }}>⏳</span>
                  読み込み中...
                </>
              ) : (
                '📋 プロンプトを確認'
              )}
            </button>

            <button
              className="btn btn-success"
              onClick={handleGenerateJournals}
              disabled={isGeneratingJournal}
              style={{
                position: 'relative',
                opacity: isGeneratingJournal ? 0.7 : 1
              }}
            >
              {isGeneratingJournal ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    marginRight: '8px',
                    animation: 'spin 1s linear infinite'
                  }}>⏳</span>
                  生成中...
                </>
              ) : (
                'ジャーナルを生成'
              )}
            </button>
          </div>
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
                  disabled={Array.from(generatingComments).some(key =>
                    key.startsWith(`${journal.id || journal._id}-`) && key.endsWith('-root'))}
                >
                  {Array.from(generatingComments).some(key =>
                    key.startsWith(`${journal.id || journal._id}-`) && key.endsWith('-root')) ? (
                    <option value="">🔄 コメント生成中...</option>
                  ) : (
                    <>
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
                    </>
                  )}
                </select>

                {/* コメント生成状況の表示 */}
                {Array.from(generatingComments).some(key => key.startsWith(journal.id || journal._id)) && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#856404'
                  }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '6px' }}>
                      ⏳
                    </span>
                    AIがコメントを生成しています...
                  </div>
                )}
              </div>

              <div className="comments-list" style={{ marginTop: '15px' }}>
                {journalComments[journal.id || journal._id] &&
                  organizeComments(journalComments[journal.id || journal._id]).map(comment =>
                    renderComment(comment, journal.id || journal._id, 0)
                  )
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* プロンプトプレビューモーダル */}
      {showPromptModal && promptPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            width: '90%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0 }}>生成プロンプトプレビュー</h3>
              <button
                onClick={() => setShowPromptModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '4px 0', color: '#666' }}>
                <strong>キャラクター:</strong> {promptPreview.character_name}
              </p>
              <p style={{ margin: '4px 0', color: '#666' }}>
                <strong>テーマ:</strong> {promptPreview.theme}
              </p>
              {promptPreview.estimated_tokens && (
                <p style={{ margin: '4px 0', color: '#666' }}>
                  <strong>推定トークン数:</strong> 約{promptPreview.estimated_tokens.toLocaleString()}トークン
                  <span style={{ fontSize: '12px', marginLeft: '8px', color: '#999' }}>
                    (±20%の誤差があります)
                  </span>
                </p>
              )}
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '14px'
            }}>
              {promptPreview.prompt}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline-secondary"
                onClick={handleCopyPrompt}
              >
                📋 コピー
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowPromptModal(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalsPanel;