// frontend/src/pages/App/pages/Settings/components/ShareClasses/ShareClasses.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { SearchIcon, PlusIcon } from "./icons"; 
import ShareClassCard from "./components/Card/ShareClassCard";
import NewShareClassDrawer from "./components/Drawer/NewShareClassDrawer";
import Toast from "../../../../components/Toast/Toast.jsx"; // Import Toast
import { useShareClasses } from "../../../../hooks/useShareClass"; 

import "./ShareClasses.css";

const ShareClasses = () => {
  const { fundId } = useOutletContext();
  const [toast, setToast] = useState(null); // Added Toast state

  const { 
    data: savedShareClasses, 
    isLoading, 
    error, 
    create,
    fetchAll 
  } = useShareClasses(fundId);

  const [searchTerm, setSearchTerm] = useState("");
  const [isNewShareOpen, setIsNewShareOpen] = useState(false);

  // Updated handler with Toast feedback
  const handleCreate = async (payload) => {
    try {
      await create(payload);
      await fetchAll();
      
      setToast({
        type: "success",
        title: "Share Class Created",
        message: "The new share class has been added successfully."
      });
    } catch (err) {
      setToast({
        type: "error",
        title: "Creation Failed",
        message: err.message || "An error occurred while creating the share class."
      });
      // We throw the error so the Drawer knows NOT to close
      throw err;
    }
  };

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
            <ShareClassCard key={cls.share_class_id} shareClass={cls} />
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
        onCreate={handleCreate} 
      />

      {/* Global Toast for ShareClasses Page */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ShareClasses;