import { useState, useRef } from "react";
import useApi from "../api/useApi"; // Adjust relative path as needed

export function usePnLUpload(fundId, selectedTimeframeIds, onSuccess) {
  const api = useApi();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    if (!fundId) return alert("Missing fundId in URL.");
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      form.append("quarters", JSON.stringify(selectedTimeframeIds || []));

      // useApi automatically omits Content-Type header when it detects FormData
      const data = await api.post(`/api/funds/${encodeURIComponent(fundId)}/financials/pnl/upload`, form);
      
      console.log("Upload success:", data);
      if (onSuccess) onSuccess(); // Optionally reload the grid
    } catch (err) {
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return { fileInputRef, uploading, handleUploadClick, handleFileSelected };
}