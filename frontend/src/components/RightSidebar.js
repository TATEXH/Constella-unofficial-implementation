import React, { useState } from 'react';
import api from '../services/api';

const RightSidebar = ({ characters, onSelectCharacter, onCreateNew, onCharacterUpdate }) => {
  const [importing, setImporting] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [importFileMap, setImportFileMap] = useState(new Map()); // ファイル名とファイルの対応を保持

  const handleExportAll = async () => {
    try {
      const response = await api.exportAllCharacters();

      // ZIPファイルをダウンロード
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'characters.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('全キャラクターをエクスポートしました。');
    } catch (error) {
      console.error('一括エクスポートエラー:', error);
      alert('エクスポートに失敗しました。');
    }
  };

  const handleImportFiles = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // ファイルマップを作成
    const fileMap = new Map();
    files.forEach(file => {
      fileMap.set(file.name, file);
    });
    setImportFileMap(fileMap);

    setImporting(true);
    let duplicates = [];
    try {
      const result = await api.importCharacters(files);

      // 重複があるかチェック
      duplicates = result.results.filter(r => r.status === 'duplicate');
      if (duplicates.length > 0) {
        setDuplicateFiles(duplicates);
        // 重複の通知はダイアログで行うのでアラートは不要
      }

      // 成功したインポートの報告
      const successes = result.results.filter(r => r.status === 'success');
      if (successes.length > 0) {
        if (duplicates.length === 0) {
          alert(`${successes.length}個のキャラクターをインポートしました。`);
        }
        onCharacterUpdate(); // リストを更新
      }

      // エラーの報告
      const errors = result.results.filter(r => r.status === 'error');
      if (errors.length > 0) {
        console.error('インポートエラー:', errors);
        alert(`${errors.length}個のファイルでエラーが発生しました。\n詳細はコンソールを確認してください。`);
      }

    } catch (error) {
      console.error('インポートエラー:', error);
      alert('インポートに失敗しました。');
    } finally {
      setImporting(false);
      if (duplicates.length === 0) {
        event.target.value = ''; // 重複がない場合のみリセット
        setImportFileMap(new Map()); // ファイルマップもクリア
      }
    }
  };

  const handleOverwriteConfirm = async (duplicateItem, overwrite) => {
    if (overwrite) {
      try {
        // 元のファイルを取得
        const originalFile = importFileMap.get(duplicateItem.filename);
        if (!originalFile) {
          alert('ファイルが見つかりません。');
          return;
        }

        // 上書きAPIを呼び出し
        const result = await api.importCharacterOverwrite(duplicateItem.existing_id, originalFile);
        alert(`キャラクター「${duplicateItem.character_name}」を上書きしました。`);

        // キャラクターリストを更新
        onCharacterUpdate();
      } catch (error) {
        console.error('上書きエラー:', error);
        alert('上書きに失敗しました。');
      }
    }

    // 重複リストから削除
    setDuplicateFiles(prev => prev.filter(item => item !== duplicateItem));

    // 全ての重複処理が完了したらクリーンアップ
    if (duplicateFiles.length <= 1) {
      setImportFileMap(new Map());
      // ファイル入力をリセット
      const fileInput = document.getElementById('character-import');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="sidebar sidebar-right">
      <h3 style={{ marginBottom: '20px' }}>キャラクター</h3>

      {/* インポート/エクスポートボタン */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="file"
            multiple
            accept=".json"
            onChange={handleImportFiles}
            style={{ display: 'none' }}
            id="character-import"
            disabled={importing}
          />
          <label
            htmlFor="character-import"
            className={`btn btn-secondary ${importing ? 'disabled' : ''}`}
            style={{ textAlign: 'center', cursor: importing ? 'not-allowed' : 'pointer' }}
          >
            {importing ? 'インポート中...' : 'インポート'}
          </label>

          <button
            className="btn btn-secondary"
            onClick={handleExportAll}
            disabled={characters.length === 0}
          >
            全エクスポート
          </button>
        </div>
      </div>

      {/* 重複確認ダイアログ */}
      {duplicateFiles.length > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#856404' }}>重複キャラクター</h4>
          {duplicateFiles.map((item, index) => (
            <div key={index} style={{
              background: '#fff',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '10px',
              border: '1px solid #ddd'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                <strong>{item.character_name}</strong> は既に存在します
              </p>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleOverwriteConfirm(item, true)}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  上書き
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOverwriteConfirm(item, false)}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  スキップ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
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
                src={`http://localhost:8000${character.image_path}`}
                alt={character.name}
                className="character-image"
                onError={(e) => {
                  e.target.src = '/placeholder.png';
                }}
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