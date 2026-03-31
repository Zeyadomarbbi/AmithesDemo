// frontend/src/pages/App/pages/Settings/components/ShareClasses/ShareClasses.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PlusIcon } from '/src/components/Icons/InteractiveIcons'; 
import SearchBar from "../../../../../../components/SearchBar/SearchBar.jsx";
import ShareClassCard from "./components/Card/ShareClassCard";
import NewShareClassDrawer from "./components/Drawer/NewShareClassDrawer";
import Toast from "../../../../components/Toast/Toast.jsx"; 
import { useShareClasses } from "../../../../hooks/useShareClass"; 
import { PageSpinner, PageError, PageNoData } from "../../../../../../components/LoadingScreens/LoadingScreens.jsx";

import "./ShareClasses.css";

const ShareClasses = () => {
  const { fundId } = useOutletContext();
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingShareClass, setEditingShareClass] = useState(null);

  const { 
    data: savedShareClasses, 
    isLoading, 
    error, 
    create,
    update, // <-- Extracted update from your hook
    remove,
    fetchAll 
  } = useShareClasses(fundId);

  const handleSave = async (payload, id) => {
    if (id) {
      // Edit Flow
      try {
        await update(id, payload);
        setToast({ 
          type: "success", 
          title: "Share Class Updated", 
          message: "The share class has been updated successfully." 
        });
      } catch (err) {
        setToast({ 
          type: "error", 
          title: "Update Failed", 
          message: err.message || "An error occurred while updating the share class." 
        });
      }
    } else {
      // Create Flow
      try {
        await create(payload);
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
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      setToast({ type: "success", title: "Share Class Deleted", message: "The share class has been successfully removed." });
    } catch (err) {
      setToast({ type: "error", title: "Deletion Failed", message: err.message || "An error occurred while deleting the share class." });
    }
  };

  const openDrawerForNew = () => {
    setEditingShareClass(null);
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (cls) => {
    setEditingShareClass(cls);
    setIsDrawerOpen(true);
  };

  const filteredShareClasses = (savedShareClasses || []).filter((cls) => {
    const query = searchTerm.toLowerCase();
    const nameMatch = (cls.share_class_name || "").toLowerCase().includes(query);
    const isinMatch = (cls.isin_code || "").toLowerCase().includes(query);
    return nameMatch || isinMatch;
  });

  if (isLoading) return <PageSpinner label="Loading share classes..." />;
  if (error) return <PageError message={error} />;

  return (
    <div className="share-classes-wrap">
      <SearchBar 
        placeholder="Search by share class or ISIN..."
        onSearch={(value) => setSearchTerm(value)}
        containerClassName="share-search"
        className="share-search-input"
      />

      <div className="share-list">
        {filteredShareClasses.length === 0 ? (
           <PageNoData message={searchTerm ? "No share classes found matching your search." : "No share classes found."} />
        ) : (
          filteredShareClasses.map((cls) => (
            <ShareClassCard 
              key={cls.share_class_id} 
              shareClass={cls} 
              onEdit={() => openDrawerForEdit(cls)}
              onDelete={() => handleDelete(cls.share_class_id)}
            />
          ))
        )}
      </div>

      <button type="button" className="share-new-btn" onClick={openDrawerForNew}>
        <PlusIcon />
        <span>New share class</span>
      </button>

      <NewShareClassDrawer 
        isOpen={isDrawerOpen} 
        initialData={editingShareClass}
        onClose={() => setIsDrawerOpen(false)} 
        onSave={handleSave} 
      />

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