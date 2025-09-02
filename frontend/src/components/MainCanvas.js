import React from 'react';

const MainCanvas = ({ children }) => {
  return (
    <div className="main-canvas">
      {children || (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#7f8c8d'
        }}>
          <p>パネルを選択してください</p>
        </div>
      )}
    </div>
  );
};

export default MainCanvas;