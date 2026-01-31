// frontend/src/pages/App/pages/Settings/components/ShareClasses/ShareClasses.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { SearchIcon, PlusIcon } from "./icons"; 
import ShareClassCard from "./components/Card/ShareClassCard";
import NewShareClassDrawer from "./components/Drawer/NewShareClassDrawer";
// IMPORT THE HOOK HERE DIRECTLY
import { useShareClasses } from "../../../../hooks/useShareClass"; 

import "./ShareClasses.css";

const ShareClasses = () => {
  // 1. Get Fund ID from Layout
  const { fundId } = useOutletContext();

  // 2. Fetch Data LOCALLY (Source of Truth)
  const { 
    data: savedShareClasses, 
    isLoading, 
    error, 
    create,     // The API create function
    fetchAll    // The refresh function
  } = useShareClasses(fundId);

  const [searchTerm, setSearchTerm] = useState("");
  const [isNewShareOpen, setIsNewShareOpen] = useState(false);

  // 3. HANDLER: Save to DB & Refresh List
  // This function is passed down to the Drawer
  const handleCreate = async (payload) => {
    // A. Call API
    await create(payload);
    // B. Refresh List immediately to show the new item
    await fetchAll();
  };

  // 4. FILTER (Client-side search)
  const filteredShareClasses = (savedShareClasses || []).filter((cls) => {
    const query = searchTerm.toLowerCase();
    const nameMatch = (cls.share_class_name || "").toLowerCase().includes(query);
    const isinMatch = (cls.isin_code || "").toLowerCase().includes(query);
    return nameMatch || isinMatch;
  });

  if (isLoading) return <div className="p-4 text-gray-500">Loading share classes...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="share-classes-wrap">
      {/* Search Bar */}
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

      {/* List */}
      <div className="share-list">
        {filteredShareClasses.length === 0 ? (
           <p className="no-shares-msg">No share classes found.</p>
        ) : (
          filteredShareClasses.map((cls) => (
            <ShareClassCard key={cls.share_class_id} shareClass={cls} />
          ))
        )}
      </div>

      {/* Add Button */}
      <button type="button" className="share-new-btn" onClick={() => setIsNewShareOpen(true)}>
        <PlusIcon />
        <span>New share class</span>
      </button>

      {/* Drawer - Note we pass handleCreate as 'onCreate' */}
      <NewShareClassDrawer 
        isOpen={isNewShareOpen} 
        onClose={() => setIsNewShareOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
};

export default ShareClasses;