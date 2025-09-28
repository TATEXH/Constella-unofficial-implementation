import React from 'react';

const LeftSidebar = ({ onOpenJournals, onOpenSettings }) => {
  return (
    <div className="sidebar sidebar-left">
      <button
        className="btn btn-icon"
        onClick={onOpenJournals}
        title="Journals"
      >
        📖
      </button>
      <button
        className="btn btn-icon"
        onClick={onOpenSettings}
        title="設定"
      >
        ⚙️
      </button>
    </div>
  );
};

export default LeftSidebar;