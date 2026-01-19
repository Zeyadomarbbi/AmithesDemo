// frontend/src/pages/App/pages/Settings/components/ShareClasses/ShareClasses.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { SearchIcon, PlusIcon } from "./icons"; 
import ShareClassCard from "./components/Card/ShareClassCard";
import NewShareClassDrawer from "./components/Drawer/NewShareClassDrawer";

import "./ShareClasses.css";

const ShareClasses = () => {
  // 1. Get Context from Parent (SettingsPage)  
  const { 
    fundId, 
    pendingShareClasses, 
    setPendingShareClasses,
    // NEW: Get the data from context
    savedShareClasses,      
    isShareClassLoading,
    shareClassError
  } = useOutletContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [isNewShareOpen, setIsNewShareOpen] = useState(false);

  // 3. HANDLER: Add to Parent's Pending State
  const handleLocalCreate = async (newShareClassData) => {
    const newClass = {
      ...newShareClassData,
      id: `temp-${Date.now()}`, // Temp ID for React keys
      isLocal: true // Flag for styling (e.g., yellow border)
    };
    
    setPendingShareClasses((prev) => [...prev, newClass]);
  };

  // 4. MERGE: Combine Server Data + Pending Data
  // Note: pendingShareClasses comes from context now
  const allShareClasses = [...(savedShareClasses || []), ...(pendingShareClasses || [])];
  // 5. FILTER
  const filteredShareClasses = allShareClasses.filter((cls) => {
    const query = searchTerm.toLowerCase();
    const nameMatch = (cls.share_class_name || "").toLowerCase().includes(query);
    const isinMatch = (cls.isin_code || "").toLowerCase().includes(query);
    return nameMatch || isinMatch;
  });

  if (isShareClassLoading) return <div className="p-4 text-gray-500">Loading share classes...</div>;
  if (shareClassError) return <div className="p-4 text-red-500">Error: {shareClassError}</div>;
  return (
    <div className="share-classes-wrap">
      <div className="share-search">
        <span className="share-search-icon"><SearchIcon /></span>
        <input
          type="text"
          className="share-search-input"
          placeholder="Search by share class or ISIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="share-list">
        {filteredShareClasses.length === 0 ? (
           <p className="no-shares-msg">No share classes found.</p>
        ) : (
          filteredShareClasses.map((cls) => (
            <ShareClassCard key={cls.id} shareClass={cls} />
          ))
        )}
      </div>

      <button type="button" className="share-new-btn" onClick={() => setIsNewShareOpen(true)}>
        <PlusIcon />
        <span>New share class</span>
      </button>

      <NewShareClassDrawer 
        isOpen={isNewShareOpen} 
        onClose={() => setIsNewShareOpen(false)} 
        onCreate={handleLocalCreate} 
      />
    </div>
  );
};

export default ShareClasses;