import React from 'react';

const LeftSidebar = ({ onOpenJournals }) => {
  return (
    <div className="sidebar sidebar-left">
      <button 
        className="btn btn-icon" 
        onClick={onOpenJournals}
        title="Journals"
      >
        📖
      </button>
    </div>
  );
};

export default LeftSidebar;