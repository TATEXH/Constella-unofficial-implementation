import React, { useState } from 'react';

const FriendsDiscoveryModal = ({ 
  isOpen, 
  onClose, 
  generatedCharacters, 
  onSaveCharacter,
  onDeleteCharacter 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Friends Discovery - 新しいキャラクター</h3>
          <button className="btn btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          {generatedCharacters && generatedCharacters.length > 0 ? (
            <div className="generated-characters">
              {generatedCharacters.map((char, index) => (
                <div key={index} className="generated-character-card">
                  <div className="character-info">
                    <h4>{char.name}</h4>
                    
                    <div className="info-section">
                      <strong>紹介:</strong>
                      <p>{char.introduction}</p>
                    </div>
                    
                    <div className="info-section">
                      <strong>背景:</strong>
                      <p>{char.backstory}</p>
                    </div>
                    
                    <div className="relationships">
                      <div className="relationship-item">
                        <strong>→ あなたへの関係:</strong>
                        <p>{char.my_relationship}</p>
                      </div>
                      <div className="relationship-item">
                        <strong>← あなたからの関係:</strong>
                        <p>{char.your_relationship}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="character-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => onSaveCharacter(char)}
                    >
                      キャラクターとして保存
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => onDeleteCharacter(index)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>生成されたキャラクターがありません。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsDiscoveryModal;